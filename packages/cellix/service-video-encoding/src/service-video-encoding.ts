import { mkdir, mkdtemp, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, relative, sep } from 'node:path';
import type { ServiceBase } from '@cellix/api-services-spec';
import { DASH_MANIFEST, type EncodingPlan, ffmpegEncodeArgs, HLS_MANIFEST, packagerArgs, planEncoding } from './encoding-plan.ts';
import type { EncodeVideoOptions, EncodeVideoRequest, EncodeVideoResult, ServiceVideoEncodingOptions, VideoEncoding, VideoEncodingStage } from './interfaces.ts';
import { ffprobeArgs, parseProbeOutput, type SourceInfo } from './probe-source.ts';
import { ProcessFailure, runProcess } from './run-process.ts';
import { VideoEncodingError, type VideoEncodingErrorCode } from './video-encoding-error.ts';

const UPLOAD_CONCURRENCY = 8;
const REQUIRED_ENCODERS = ['libx264', 'aac'] as const;

interface ToolPaths {
	ffmpeg: string;
	ffprobe: string;
	packager: string;
}

interface Job {
	controller: AbortController;
	done: Promise<unknown>;
}

export class ServiceVideoEncoding implements ServiceBase<VideoEncoding>, VideoEncoding {
	private readonly options: ServiceVideoEncodingOptions;
	private readonly tools: ToolPaths;
	private readonly jobs = new Set<Job>();
	private started = false;

	constructor(options: ServiceVideoEncodingOptions) {
		this.options = options;
		this.tools = {
			ffmpeg: options.ffmpegPath ?? 'ffmpeg',
			ffprobe: options.ffprobePath ?? 'ffprobe',
			packager: options.packagerPath ?? 'packager',
		};
	}

	public async startUp(): Promise<VideoEncoding> {
		await this.verifyTool(this.tools.ffmpeg, ['-hide_banner', '-version']);
		await this.verifyTool(this.tools.ffprobe, ['-hide_banner', '-version']);
		await this.verifyTool(this.tools.packager, ['--version']);

		const encoders = await this.verifyTool(this.tools.ffmpeg, ['-hide_banner', '-encoders']);
		const missing = REQUIRED_ENCODERS.filter((encoder) => !new RegExp(`^\\s*\\S+\\s+${encoder}\\s`, 'm').test(encoders));
		if (missing.length > 0) {
			throw new VideoEncodingError('tool-unavailable', `${this.tools.ffmpeg} is missing required encoders: ${missing.join(', ')}`);
		}

		this.started = true;
		console.info(`[ServiceVideoEncoding] started. ffmpeg=${this.tools.ffmpeg}, ffprobe=${this.tools.ffprobe}, packager=${this.tools.packager}`);
		return this;
	}

	public async shutDown(): Promise<void> {
		this.started = false;
		const running = [...this.jobs];
		for (const job of running) {
			job.controller.abort();
		}
		await Promise.allSettled(running.map((job) => job.done));
	}

	public async encode(request: EncodeVideoRequest, options: EncodeVideoOptions = {}): Promise<EncodeVideoResult> {
		if (!this.started) {
			throw new Error('ServiceVideoEncoding is not started - call startUp() before encode()');
		}
		if (options.signal?.aborted) {
			throw new VideoEncodingError('aborted', 'Encoding was aborted before it started');
		}

		const controller = new AbortController();
		const forwardAbort = () => controller.abort();
		options.signal?.addEventListener('abort', forwardAbort, { once: true });

		const done = this.runJob(request, options, controller.signal);
		const job: Job = { controller, done };
		this.jobs.add(job);
		try {
			return await done;
		} finally {
			this.jobs.delete(job);
			options.signal?.removeEventListener('abort', forwardAbort);
		}
	}

	private async runJob(request: EncodeVideoRequest, options: EncodeVideoOptions, signal: AbortSignal): Promise<EncodeVideoResult> {
		const report = (stage: VideoEncodingStage, percent: number) => {
			try {
				options.onProgress?.({ stage, percent });
			} catch {
				// Progress listeners must not be able to fail the job.
			}
		};

		const baseDir = this.options.workingDirectory ?? tmpdir();
		await mkdir(baseDir, { recursive: true });
		const jobDir = await mkdtemp(join(baseDir, 'cellix-video-encoding-'));

		try {
			const sourcePath = join(jobDir, 'source');
			report('downloading', 0);
			await this.download(request, sourcePath, signal);
			report('downloading', 100);

			report('probing', 0);
			const source = await this.probe(sourcePath, signal);
			const plan = planEncoding(source);
			report('probing', 100);

			report('encoding', 0);
			await this.encodeRenditions(sourcePath, jobDir, source, plan, signal, (percent) => report('encoding', percent));
			report('encoding', 100);

			report('packaging', 0);
			await this.runTool(this.tools.packager, packagerArgs(plan), 'packaging-failed', signal, { cwd: jobDir });
			report('packaging', 100);

			const prefix = normalizePrefix(request.destination.prefix);
			report('uploading', 0);
			await this.upload(join(jobDir, 'out'), request.destination.containerName, prefix, signal, (percent) => report('uploading', percent));
			report('uploading', 100);

			return {
				manifests: {
					dash: { containerName: request.destination.containerName, blobName: `${prefix}${DASH_MANIFEST}` },
					hls: { containerName: request.destination.containerName, blobName: `${prefix}${HLS_MANIFEST}` },
				},
				durationSeconds: source.durationSeconds,
				renditions: plan.renditions.map(({ width, height, videoBitrateKbps }) => ({ width, height, videoBitrateKbps })),
				hasAudio: plan.hasAudio,
				textTracks: plan.textTracks.map(({ language }) => ({ language })),
			};
		} catch (error) {
			if (signal.aborted) {
				throw new VideoEncodingError('aborted', 'Encoding was aborted', { cause: error });
			}
			throw error;
		} finally {
			await rm(jobDir, { recursive: true, force: true });
		}
	}

	private async download(request: EncodeVideoRequest, filePath: string, signal: AbortSignal): Promise<void> {
		const { containerName, blobName } = request.source;
		try {
			await this.options.blobStorage.downloadToFile({ containerName, blobName, filePath, abortSignal: signal });
		} catch (error) {
			const notFound = (error as { statusCode?: unknown } | null)?.statusCode === 404;
			throw new VideoEncodingError(notFound ? 'source-not-found' : 'storage-failed', `Could not download source ${containerName}/${blobName}`, { cause: error });
		}
	}

	private async probe(sourcePath: string, signal: AbortSignal): Promise<SourceInfo> {
		const stdout = await this.runTool(this.tools.ffprobe, ffprobeArgs(sourcePath), 'unsupported-source', signal);
		return parseProbeOutput(stdout);
	}

	private async encodeRenditions(sourcePath: string, jobDir: string, source: SourceInfo, plan: EncodingPlan, signal: AbortSignal, onPercent: (percent: number) => void): Promise<void> {
		const encodedDir = join(jobDir, 'encoded');
		await mkdir(encodedDir);
		let lastPercent = 0;
		await this.runTool(this.tools.ffmpeg, ffmpegEncodeArgs(sourcePath, encodedDir, plan), 'encode-failed', signal, {
			onStdoutLine: (line) => {
				const match = /^out_time_us=(\d+)$/.exec(line);
				if (!match) {
					return;
				}
				const percent = Math.min(99, Math.floor((Number(match[1]) / 1_000_000 / source.durationSeconds) * 100));
				if (percent > lastPercent) {
					lastPercent = percent;
					onPercent(percent);
				}
			},
		});
	}

	/** Uploads segments and media playlists first and the two top-level manifests last. */
	private async upload(outDir: string, containerName: string, prefix: string, signal: AbortSignal, onPercent: (percent: number) => void): Promise<void> {
		const files = (await listFiles(outDir)).map((path) => relative(outDir, path).split(sep).join('/'));
		const manifests = [DASH_MANIFEST, HLS_MANIFEST].filter((name) => files.includes(name));
		const media = files.filter((name) => !manifests.includes(name));
		let uploaded = 0;

		const uploadOne = async (name: string) => {
			try {
				await this.options.blobStorage.uploadFile({
					containerName,
					blobName: `${prefix}${name}`,
					filePath: join(outDir, name),
					httpHeaders: { blobContentType: contentTypeOf(name) },
					abortSignal: signal,
				});
			} catch (error) {
				throw new VideoEncodingError('storage-failed', `Could not upload ${containerName}/${prefix}${name}`, { cause: error });
			}
			uploaded += 1;
			onPercent(Math.floor((uploaded / files.length) * 100));
		};

		await runWithConcurrency(media, UPLOAD_CONCURRENCY, uploadOne);
		for (const name of manifests) {
			await uploadOne(name);
		}
	}

	private async verifyTool(command: string, args: string[]): Promise<string> {
		try {
			return await runProcess(command, args);
		} catch (error) {
			throw new VideoEncodingError('tool-unavailable', `${command} is not usable: ${(error as Error).message}`, { cause: error });
		}
	}

	private async runTool(command: string, args: string[], failureCode: VideoEncodingErrorCode, signal: AbortSignal, options: { cwd?: string; onStdoutLine?: (line: string) => void } = {}): Promise<string> {
		try {
			return await runProcess(command, args, { ...options, signal });
		} catch (error) {
			if (error instanceof ProcessFailure && error.kind === 'aborted') {
				throw new VideoEncodingError('aborted', error.message, { cause: error });
			}
			const code = error instanceof ProcessFailure && error.kind === 'spawn' ? 'tool-unavailable' : failureCode;
			throw new VideoEncodingError(code, (error as Error).message, { cause: error });
		}
	}
}

function normalizePrefix(prefix: string): string {
	return prefix === '' || prefix.endsWith('/') ? prefix : `${prefix}/`;
}

function contentTypeOf(name: string): string {
	if (name.endsWith('.mpd')) {
		return 'application/dash+xml';
	}
	if (name.endsWith('.m3u8')) {
		return 'application/vnd.apple.mpegurl';
	}
	if (name.endsWith('.vtt')) {
		return 'text/vtt';
	}
	return name.startsWith('audio/') ? 'audio/mp4' : 'video/mp4';
}

async function listFiles(dir: string): Promise<string[]> {
	const entries = await readdir(dir, { withFileTypes: true, recursive: true });
	return entries
		.filter((entry) => entry.isFile())
		.map((entry) => join(entry.parentPath, entry.name))
		.sort();
}

/** Runs `task` over `items` with bounded concurrency, stopping new work after the first failure. */
async function runWithConcurrency<T>(items: T[], concurrency: number, task: (item: T) => Promise<void>): Promise<void> {
	const queue = [...items];
	let failure: { error: unknown } | undefined;

	const worker = async () => {
		while (!failure && queue.length > 0) {
			const item = queue.shift() as T;
			try {
				await task(item);
			} catch (error) {
				failure ??= { error };
			}
		}
	};

	await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, worker));
	if (failure) {
		throw failure.error;
	}
}
