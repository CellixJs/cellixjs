import { EventEmitter } from 'node:events';
import { mkdir, mkdtemp, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, isAbsolute, join } from 'node:path';
import { PassThrough } from 'node:stream';
import type { DownloadBlobToFileRequest, UploadFileBlobRequest } from '@cellix/service-blob-storage';
import { type EncodeVideoRequest, ServiceVideoEncoding, VideoEncodingError, type VideoEncodingProgress } from '@cellix/service-video-encoding';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { spawnMock } = vi.hoisted(() => ({ spawnMock: vi.fn() }));

vi.mock('node:child_process', () => ({ spawn: spawnMock }));

interface ToolCall {
	command: string;
	args: string[];
	cwd: string | undefined;
}

class FakeProcess extends EventEmitter {
	public readonly stdout = new PassThrough();
	public readonly stderr = new PassThrough();
	public killed = false;

	public kill(): boolean {
		this.killed = true;
		setImmediate(() => this.exit(null));
		return true;
	}

	public exit(code: number | null, stderr?: string): void {
		if (stderr) {
			this.stderr.write(stderr);
		}
		this.stdout.end();
		this.stderr.end();
		setImmediate(() => this.emit('close', code, code === null ? 'SIGKILL' : null));
	}
}

type ToolName = 'ffmpeg' | 'ffprobe' | 'packager';

type ToolScript = (call: ToolCall, process: FakeProcess) => void | Promise<void>;

interface ProbeOptions {
	width?: number;
	height?: number;
	rotation?: number;
	audio?: boolean;
	subtitles?: { codec: string; language?: string }[];
	duration?: string;
	video?: boolean;
}

function probeJson(options: ProbeOptions = {}): string {
	const { width = 1920, height = 1080, rotation, audio = true, subtitles = [], duration = '10.000000', video = true } = options;
	const streams: Record<string, unknown>[] = [];
	if (video) {
		streams.push({
			index: 0,
			codec_type: 'video',
			codec_name: 'h264',
			width,
			height,
			...(rotation === undefined ? {} : { side_data_list: [{ side_data_type: 'Display Matrix', rotation }] }),
		});
	}
	if (audio) {
		streams.push({ index: streams.length, codec_type: 'audio', codec_name: 'aac' });
	}
	for (const subtitle of subtitles) {
		streams.push({
			index: streams.length,
			codec_type: 'subtitle',
			codec_name: subtitle.codec,
			...(subtitle.language ? { tags: { language: subtitle.language } } : {}),
		});
	}
	return JSON.stringify({ streams, format: { duration } });
}

function argAfter(args: string[], flag: string): string | undefined {
	const index = args.indexOf(flag);
	return index === -1 ? undefined : args[index + 1];
}

function resolveFrom(call: ToolCall, path: string): string {
	return isAbsolute(path) || !call.cwd ? path : join(call.cwd, path);
}

async function touch(path: string, content = 'x'): Promise<void> {
	await mkdir(dirname(path), { recursive: true });
	await writeFile(path, content);
}

/** Writes every output file named on an ffmpeg command line and reports progress. */
const fakeFfmpegEncode: ToolScript = async (call, process) => {
	const outputs = call.args.filter((arg, index) => /\.(mp4|vtt)$/.test(arg) && call.args[index - 1] !== '-i');
	for (const output of outputs) {
		await touch(resolveFrom(call, output));
	}
	process.stdout.write('out_time_us=2500000\nprogress=continue\nout_time_us=5000000\nprogress=continue\nout_time_us=10000000\nprogress=end\n');
	process.exit(0);
};

/** Writes the files a shaka-packager command line would produce. */
const fakePackager: ToolScript = async (call, process) => {
	for (const arg of call.args.filter((value) => value.startsWith('in='))) {
		const fields: { init_segment?: string; segment_template?: string; playlist_name?: string } = Object.fromEntries(arg.split(',').map((field) => field.split('=') as [string, string]));
		if (fields.init_segment) {
			await touch(resolveFrom(call, fields.init_segment));
		}
		if (fields.segment_template) {
			await touch(resolveFrom(call, fields.segment_template.replace('$Number$', '1')));
		}
		if (fields.playlist_name) {
			const mpdDir = dirname(resolveFrom(call, argAfter(call.args, '--mpd_output') ?? ''));
			await touch(join(mpdDir, fields.playlist_name));
		}
	}
	await touch(resolveFrom(call, argAfter(call.args, '--mpd_output') ?? ''), '<MPD/>');
	await touch(resolveFrom(call, argAfter(call.args, '--hls_master_playlist_output') ?? ''), '#EXTM3U');
	process.exit(0);
};

function createTools() {
	const scripts: Record<ToolName, ToolScript> = {
		ffmpeg: (call, process) => {
			if (call.args.includes('-version')) {
				process.stdout.write('ffmpeg version 9.0.1');
				process.exit(0);
				return;
			}
			if (call.args.includes('-encoders')) {
				process.stdout.write(' V....D libx264              libx264 H.264\n A....D aac                  AAC\n');
				process.exit(0);
				return;
			}
			return fakeFfmpegEncode(call, process);
		},
		ffprobe: (call, process) => {
			if (call.args.includes('-version')) {
				process.stdout.write('ffprobe version 9.0.1');
				process.exit(0);
				return;
			}
			process.stdout.write(probeJson());
			process.exit(0);
		},
		packager: (call, process) => {
			if (call.args.includes('--version')) {
				process.stdout.write('packager version v3.9.3');
				process.exit(0);
				return;
			}
			return fakePackager(call, process);
		},
	};
	const calls: ToolCall[] = [];
	const processes: FakeProcess[] = [];
	const toolNames: Record<ToolName, string> = { ffmpeg: 'ffmpeg', ffprobe: 'ffprobe', packager: 'packager' };

	spawnMock.mockImplementation((command: string, args: string[], spawnOptions?: { cwd?: string }) => {
		const call = { command, args, cwd: spawnOptions?.cwd };
		calls.push(call);
		const process = new FakeProcess();
		processes.push(process);
		const tool = (Object.keys(toolNames) as ToolName[]).find((key) => toolNames[key] === command);
		if (!tool) {
			setImmediate(() => process.emit('error', Object.assign(new Error(`spawn ${command} ENOENT`), { code: 'ENOENT' })));
			return process;
		}
		setImmediate(() => void scripts[tool](call, process));
		return process;
	});

	return {
		scripts,
		calls,
		processes,
		toolNames,
		encodeCall: () => calls.find((call) => call.command === toolNames.ffmpeg && call.args.includes('-filter_complex')),
		packagerCall: () => calls.find((call) => call.command === toolNames.packager && !call.args.includes('--version')),
		probe(options: ProbeOptions) {
			scripts.ffprobe = (call, process) => {
				process.stdout.write(call.args.includes('-version') ? 'ffprobe version 9.0.1' : probeJson(options));
				process.exit(0);
			};
		},
	};
}

function createBlobStorage() {
	const sources = new Map<string, string>([['uploads/raw/abc123.mov', 'source-bytes']]);
	const uploads: { containerName: string; blobName: string; contentType: string | undefined }[] = [];
	return {
		sources,
		uploads,
		downloadToFile: vi.fn(async (request: DownloadBlobToFileRequest) => {
			const content = sources.get(`${request.containerName}/${request.blobName}`);
			if (content === undefined) {
				throw Object.assign(new Error('The specified blob does not exist.'), { statusCode: 404 });
			}
			await writeFile(request.filePath, content);
		}),
		uploadFile: vi.fn((request: UploadFileBlobRequest) => {
			uploads.push({ containerName: request.containerName, blobName: request.blobName, contentType: request.httpHeaders?.blobContentType });
			return Promise.resolve({} as never);
		}),
	};
}

const request: EncodeVideoRequest = {
	source: { containerName: 'uploads', blobName: 'raw/abc123.mov' },
	destination: { containerName: 'videos', prefix: 'abc123/' },
};

async function expectEncodingError(promise: Promise<unknown>, code: string): Promise<VideoEncodingError> {
	const error = await promise.then(
		() => undefined,
		(reason: unknown) => reason,
	);
	expect(error).toBeInstanceOf(VideoEncodingError);
	expect((error as VideoEncodingError).code).toBe(code);
	return error as VideoEncodingError;
}

describe('@cellix/service-video-encoding public contract', () => {
	let tools: ReturnType<typeof createTools>;
	let blobStorage: ReturnType<typeof createBlobStorage>;
	let workingDirectory: string;

	async function startService(overrides: Partial<ConstructorParameters<typeof ServiceVideoEncoding>[0]> = {}) {
		const service = new ServiceVideoEncoding({ blobStorage, workingDirectory, ...overrides });
		await service.startUp();
		return service;
	}

	beforeEach(async () => {
		vi.clearAllMocks();
		tools = createTools();
		blobStorage = createBlobStorage();
		workingDirectory = await mkdtemp(join(tmpdir(), 'cellix-video-encoding-test-'));
	});

	afterEach(async () => {
		await rm(workingDirectory, { recursive: true, force: true });
	});

	describe('VideoEncodingError', () => {
		it('is an Error carrying a stable code, its name, and the underlying cause', async () => {
			blobStorage.downloadToFile.mockRejectedValueOnce(Object.assign(new Error('Server busy'), { statusCode: 503 }));
			const service = await startService();

			const error = await expectEncodingError(service.encode(request), 'storage-failed');

			expect(error).toBeInstanceOf(Error);
			expect(error.name).toBe('VideoEncodingError');
			expect(error.message).toContain('uploads/raw/abc123.mov');
			expect(error.cause).toBeInstanceOf(Error);
		});
	});

	describe('ServiceVideoEncoding.startUp', () => {
		it('verifies ffmpeg, ffprobe, and packager and resolves to the service', async () => {
			const service = new ServiceVideoEncoding({ blobStorage });

			await expect(service.startUp()).resolves.toBe(service);
			expect(tools.calls.map((call) => [call.command, ...call.args].join(' '))).toEqual(
				expect.arrayContaining(['ffmpeg -hide_banner -version', 'ffmpeg -hide_banner -encoders', 'ffprobe -hide_banner -version', 'packager --version']),
			);
		});

		it('uses configured executable paths', async () => {
			Object.assign(tools.toolNames, { ffmpeg: '/opt/ffmpeg/bin/ffmpeg', ffprobe: '/opt/ffmpeg/bin/ffprobe', packager: '/opt/shaka/packager' });

			await startService({ ffmpegPath: '/opt/ffmpeg/bin/ffmpeg', ffprobePath: '/opt/ffmpeg/bin/ffprobe', packagerPath: '/opt/shaka/packager' });

			expect(new Set(tools.calls.map((call) => call.command))).toEqual(new Set(['/opt/ffmpeg/bin/ffmpeg', '/opt/ffmpeg/bin/ffprobe', '/opt/shaka/packager']));
		});

		it('falls back to default executables when configured paths are undefined', async () => {
			const unset: string | undefined = undefined;

			await startService({ ffmpegPath: unset, ffprobePath: unset, packagerPath: unset });

			expect(new Set(tools.calls.map((call) => call.command))).toEqual(new Set(['ffmpeg', 'ffprobe', 'packager']));
		});

		it('rejects with tool-unavailable when an executable cannot be spawned', async () => {
			tools.toolNames.packager = 'not-the-configured-packager';

			const error = await expectEncodingError(new ServiceVideoEncoding({ blobStorage }).startUp(), 'tool-unavailable');
			expect(error.message).toContain('packager');
		});

		it('rejects with tool-unavailable when ffmpeg lacks the libx264 encoder', async () => {
			tools.scripts.ffmpeg = (_call, process) => {
				process.stdout.write(' A....D aac                  AAC\n');
				process.exit(0);
			};

			const error = await expectEncodingError(new ServiceVideoEncoding({ blobStorage }).startUp(), 'tool-unavailable');
			expect(error.message).toContain('libx264');
		});

		it('rejects with tool-unavailable when a version check exits with an error', async () => {
			tools.scripts.ffprobe = (_call, process) => process.exit(1, 'dyld: Library not loaded');

			const error = await expectEncodingError(new ServiceVideoEncoding({ blobStorage }).startUp(), 'tool-unavailable');
			expect(error.message).toContain('dyld: Library not loaded');
		});
	});

	describe('ServiceVideoEncoding.encode', () => {
		it('rejects when called before startUp', async () => {
			await expect(new ServiceVideoEncoding({ blobStorage }).encode(request)).rejects.toThrow('not started');
		});

		it('encodes the full ladder, packages DASH and HLS, and uploads the output under the prefix', async () => {
			tools.probe({ width: 1920, height: 1080, subtitles: [{ codec: 'subrip', language: 'eng' }] });
			const service = await startService();

			const result = await service.encode(request);

			expect(result).toEqual({
				manifests: {
					dash: { containerName: 'videos', blobName: 'abc123/manifest.mpd' },
					hls: { containerName: 'videos', blobName: 'abc123/master.m3u8' },
				},
				durationSeconds: 10,
				renditions: [
					{ width: 1920, height: 1080, videoBitrateKbps: 5000 },
					{ width: 1280, height: 720, videoBitrateKbps: 2800 },
					{ width: 854, height: 480, videoBitrateKbps: 1400 },
					{ width: 640, height: 360, videoBitrateKbps: 800 },
				],
				hasAudio: true,
				textTracks: [{ language: 'eng' }],
			});
			expect(blobStorage.downloadToFile).toHaveBeenCalledWith(expect.objectContaining({ containerName: 'uploads', blobName: 'raw/abc123.mov' }));

			const uploaded = Object.fromEntries(blobStorage.uploads.map((upload) => [upload.blobName, upload.contentType]));
			expect(uploaded).toMatchObject({
				'abc123/manifest.mpd': 'application/dash+xml',
				'abc123/master.m3u8': 'application/vnd.apple.mpegurl',
				'abc123/video/1080/init.mp4': 'video/mp4',
				'abc123/video/1080/1.m4s': 'video/mp4',
				'abc123/video/1080/playlist.m3u8': 'application/vnd.apple.mpegurl',
				'abc123/video/360/1.m4s': 'video/mp4',
				'abc123/audio/init.mp4': 'audio/mp4',
				'abc123/audio/1.m4s': 'audio/mp4',
				'abc123/text/0/1.vtt': 'text/vtt',
			});
			expect(blobStorage.uploads.every((upload) => upload.containerName === 'videos')).toBe(true);
			expect(blobStorage.uploads.slice(-2).map((upload) => upload.blobName)).toEqual(['abc123/manifest.mpd', 'abc123/master.m3u8']);
		});

		it('encodes each rung as H.264 with 2-second keyframes and one AAC stereo track', async () => {
			tools.probe({ width: 1920, height: 1080 });
			const service = await startService();

			await service.encode(request);

			const args = tools.encodeCall()?.args.join(' ') ?? '';
			expect(args).toContain('[0:v:0]split=4[s0][s1][s2][s3]');
			expect(args).toContain('[s0]scale=1920:1080,setsar=1[v0]');
			expect(args).toContain('-c:v libx264');
			expect(args).toContain('-b:v 5000k');
			expect(args).toContain('-b:v 800k');
			expect(args).toContain('-force_key_frames expr:gte(t,n_forced*2)');
			expect(args).toContain('-map 0:a:0 -vn -sn -dn -c:a aac -b:a 128k -ac 2');
			expect(argAfter(tools.packagerCall()?.args ?? [], '--segment_duration')).toBe('2');
		});

		it('never upscales a source below the top rung', async () => {
			tools.probe({ width: 1280, height: 720 });
			const service = await startService();

			const result = await service.encode(request);

			expect(result.renditions.map((rendition) => rendition.height)).toEqual([720, 480, 360]);
		});

		it('anchors the ladder on the short side of portrait sources', async () => {
			tools.probe({ width: 1080, height: 1920 });
			const service = await startService();

			const result = await service.encode(request);

			expect(result.renditions[0]).toEqual({ width: 1080, height: 1920, videoBitrateKbps: 5000 });
			expect(result.renditions[3]).toEqual({ width: 360, height: 640, videoBitrateKbps: 800 });
		});

		it('treats sources rotated by 90 degrees as their displayed orientation', async () => {
			tools.probe({ width: 1920, height: 1080, rotation: -90 });
			const service = await startService();

			const result = await service.encode(request);

			expect(result.renditions[0]).toEqual({ width: 1080, height: 1920, videoBitrateKbps: 5000 });
		});

		it('produces a single rung at source size when the source is smaller than the lowest rung', async () => {
			tools.probe({ width: 321, height: 241 });
			const service = await startService();

			const result = await service.encode(request);

			expect(result.renditions).toEqual([{ width: 320, height: 240, videoBitrateKbps: 800 }]);
			expect(tools.encodeCall()?.args.join(' ')).toContain('[0:v:0]scale=320:240,setsar=1[v0]');
		});

		it('omits the audio track when the source has no audio', async () => {
			tools.probe({ audio: false });
			const service = await startService();

			const result = await service.encode(request);

			expect(result.hasAudio).toBe(false);
			expect(tools.encodeCall()?.args).not.toContain('0:a:0');
			expect(blobStorage.uploads.some((upload) => upload.blobName.startsWith('abc123/audio/'))).toBe(false);
		});

		it('extracts text subtitles in source order and skips image-based subtitles', async () => {
			tools.probe({
				subtitles: [{ codec: 'hdmv_pgs_subtitle', language: 'fre' }, { codec: 'mov_text', language: 'spa' }, { codec: 'webvtt' }],
			});
			const service = await startService();

			const result = await service.encode(request);

			expect(result.textTracks).toEqual([{ language: 'spa' }, { language: 'und' }]);
			const args = tools.encodeCall()?.args.join(' ') ?? '';
			expect(args).toContain('-map 0:s:1');
			expect(args).toContain('-map 0:s:2');
			expect(args).not.toContain('-map 0:s:0');
			const textDescriptors = tools.packagerCall()?.args.filter((arg) => arg.includes('stream=text')) ?? [];
			expect(textDescriptors[0]).toContain('language=spa');
			expect(textDescriptors[1]).not.toContain('language=');
		});

		it('adds a trailing slash to a prefix that lacks one', async () => {
			const service = await startService();

			const result = await service.encode({ ...request, destination: { containerName: 'videos', prefix: 'abc123' } });

			expect(result.manifests.dash.blobName).toBe('abc123/manifest.mpd');
		});

		it('writes to the container root when the prefix is empty', async () => {
			const service = await startService();

			const result = await service.encode({ ...request, destination: { containerName: 'videos', prefix: '' } });

			expect(result.manifests.hls.blobName).toBe('master.m3u8');
		});

		it('reports progress for every stage in order', async () => {
			const service = await startService();
			const updates: VideoEncodingProgress[] = [];

			await service.encode(request, { onProgress: (progress) => updates.push(progress) });

			const stages = [...new Set(updates.map((update) => update.stage))];
			expect(stages).toEqual(['downloading', 'probing', 'encoding', 'packaging', 'uploading']);
			for (const stage of stages) {
				const percents = updates.filter((update) => update.stage === stage).map((update) => update.percent);
				expect(percents[0]).toBe(0);
				expect(percents.at(-1)).toBe(100);
				expect(percents).toEqual([...percents].sort((a, b) => a - b));
			}
			expect(updates).toContainEqual({ stage: 'encoding', percent: 25 });
			expect(updates).toContainEqual({ stage: 'encoding', percent: 50 });
		});

		it('ignores exceptions thrown by the progress callback', async () => {
			const service = await startService();

			await expect(
				service.encode(request, {
					onProgress: () => {
						throw new Error('listener failure');
					},
				}),
			).resolves.toMatchObject({ hasAudio: true });
		});

		it('removes its temporary files after success and after failure', async () => {
			const service = await startService();
			await service.encode(request);
			expect(await readdir(workingDirectory)).toEqual([]);

			tools.scripts.packager = (_call, process) => process.exit(1, 'packaging error');
			await expectEncodingError(service.encode(request), 'packaging-failed');
			expect(await readdir(workingDirectory)).toEqual([]);
		});

		it('runs concurrent jobs in separate temporary directories', async () => {
			const service = await startService();

			const results = await Promise.all([service.encode(request), service.encode({ ...request, destination: { containerName: 'videos', prefix: 'other/' } })]);

			expect(results.map((result) => result.manifests.dash.blobName)).toEqual(['abc123/manifest.mpd', 'other/manifest.mpd']);
			const workDirs = new Set(tools.calls.filter((call) => call.args.includes('-filter_complex')).map((call) => dirname(argAfter(call.args, '-i') ?? '')));
			expect(workDirs.size).toBe(2);
		});

		describe('failures', () => {
			it('rejects with source-not-found when the source blob does not exist', async () => {
				const service = await startService();

				await expectEncodingError(service.encode({ ...request, source: { containerName: 'uploads', blobName: 'raw/missing.mov' } }), 'source-not-found');
				expect(blobStorage.uploads).toEqual([]);
			});

			it('rejects with storage-failed when the download fails for another reason', async () => {
				blobStorage.downloadToFile.mockRejectedValueOnce(Object.assign(new Error('Server busy'), { statusCode: 503 }));
				const service = await startService();

				const error = await expectEncodingError(service.encode(request), 'storage-failed');
				expect(error.cause).toMatchObject({ statusCode: 503 });
			});

			it('rejects with unsupported-source when ffprobe cannot read the source', async () => {
				const service = await startService();
				tools.scripts.ffprobe = (_call, process) => process.exit(1, 'Invalid data found when processing input');

				const error = await expectEncodingError(service.encode(request), 'unsupported-source');
				expect(error.message).toContain('Invalid data found when processing input');
			});

			it('rejects with unsupported-source when the source has no video stream', async () => {
				tools.probe({ video: false });
				const service = await startService();

				await expectEncodingError(service.encode(request), 'unsupported-source');
			});

			it('rejects with unsupported-source when the source has no known duration', async () => {
				tools.probe({ duration: 'N/A' });
				const service = await startService();

				await expectEncodingError(service.encode(request), 'unsupported-source');
			});

			it('rejects with encode-failed and includes ffmpeg error output', async () => {
				const service = await startService();
				tools.scripts.ffmpeg = (_call, process) => process.exit(1, 'Error while decoding stream #0:0');

				const error = await expectEncodingError(service.encode(request), 'encode-failed');
				expect(error.message).toContain('Error while decoding stream #0:0');
				expect(blobStorage.uploads).toEqual([]);
			});

			it('rejects with packaging-failed and uploads nothing when packaging fails', async () => {
				const service = await startService();
				tools.scripts.packager = (_call, process) => process.exit(1, 'Segment duration mismatch');

				const error = await expectEncodingError(service.encode(request), 'packaging-failed');
				expect(error.message).toContain('Segment duration mismatch');
				expect(blobStorage.uploads).toEqual([]);
			});

			it('rejects with storage-failed and never uploads manifests when a segment upload fails', async () => {
				const service = await startService();
				blobStorage.uploadFile.mockImplementation((upload: UploadFileBlobRequest) => {
					if (upload.blobName.endsWith('.m4s')) {
						return Promise.reject(new Error('Upload failed'));
					}
					blobStorage.uploads.push({ containerName: upload.containerName, blobName: upload.blobName, contentType: undefined });
					return Promise.resolve({} as never);
				});

				await expectEncodingError(service.encode(request), 'storage-failed');
				expect(blobStorage.uploads.map((upload) => upload.blobName)).not.toContain('abc123/manifest.mpd');
				expect(blobStorage.uploads.map((upload) => upload.blobName)).not.toContain('abc123/master.m3u8');
			});
		});

		describe('cancellation', () => {
			it('rejects with aborted without downloading when the signal is already aborted', async () => {
				const service = await startService();
				const controller = new AbortController();
				controller.abort();

				await expectEncodingError(service.encode(request, { signal: controller.signal }), 'aborted');
				expect(blobStorage.downloadToFile).not.toHaveBeenCalled();
			});

			it('kills a running ffmpeg process and rejects with aborted', async () => {
				const service = await startService();
				const controller = new AbortController();
				tools.scripts.ffmpeg = () => {
					controller.abort();
				};

				await expectEncodingError(service.encode(request, { signal: controller.signal }), 'aborted');
				expect(tools.processes.at(-1)?.killed).toBe(true);
				expect(await readdir(workingDirectory)).toEqual([]);
			});

			it('cancels in-flight blob transfers and rejects with aborted when aborted during upload', async () => {
				const service = await startService();
				const controller = new AbortController();
				const transferSignals: (AbortSignal | undefined)[] = [];
				blobStorage.uploadFile.mockImplementation((upload: UploadFileBlobRequest) => {
					transferSignals.push(upload.abortSignal);
					controller.abort();
					return Promise.reject(new Error('The operation was aborted.'));
				});

				await expectEncodingError(service.encode(request, { signal: controller.signal }), 'aborted');
				expect(transferSignals.length).toBeGreaterThan(0);
				expect(transferSignals.every((signal) => signal?.aborted)).toBe(true);
				expect(blobStorage.downloadToFile.mock.calls[0]?.[0].abortSignal).toBeInstanceOf(AbortSignal);
			});

			it('aborts running jobs on shutDown', async () => {
				const service = await startService();
				let encodeStarted: () => void = () => undefined;
				const started = new Promise<void>((resolve) => {
					encodeStarted = resolve;
				});
				tools.scripts.ffmpeg = () => encodeStarted();

				const job = expectEncodingError(service.encode(request), 'aborted');
				await started;
				await service.shutDown();

				await job;
				await expect(service.encode(request)).rejects.toThrow('not started');
			});
		});
	});
});
