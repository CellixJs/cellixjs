import { execFileSync } from 'node:child_process';
import { copyFile, mkdir, mkdtemp, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import type { DownloadBlobToFileRequest, UploadFileBlobRequest } from '@cellix/service-blob-storage';
import { ServiceVideoEncoding } from '@cellix/service-video-encoding';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

/**
 * Runs the real ffmpeg, ffprobe, and shaka-packager (from PATH, or the
 * FFMPEG_PATH, FFPROBE_PATH, and PACKAGER_PATH environment variables) against
 * generated clips. Blob storage is a local directory per container.
 */
describe('ServiceVideoEncoding integration with ffmpeg and shaka-packager', () => {
	const { FFMPEG_PATH, FFPROBE_PATH, PACKAGER_PATH } = process.env;
	const ffmpeg = FFMPEG_PATH ?? 'ffmpeg';
	const ffprobe = FFPROBE_PATH ?? 'ffprobe';
	let root: string;
	let storageRoot: string;
	let service: ServiceVideoEncoding;

	const blobStorage = {
		downloadToFile: async (request: DownloadBlobToFileRequest) => {
			await copyFile(join(storageRoot, request.containerName, request.blobName), request.filePath);
		},
		uploadFile: async (request: UploadFileBlobRequest) => {
			const target = join(storageRoot, request.containerName, request.blobName);
			await mkdir(dirname(target), { recursive: true });
			await copyFile(request.filePath, target);
			return {} as never;
		},
	};

	async function storeSource(blobName: string, ffmpegArgs: string[]): Promise<void> {
		const target = join(storageRoot, 'uploads', blobName);
		await mkdir(dirname(target), { recursive: true });
		execFileSync(ffmpeg, ['-y', '-v', 'error', ...ffmpegArgs, target]);
	}

	async function listBlobs(containerName: string, prefix: string): Promise<string[]> {
		const entries = await readdir(join(storageRoot, containerName, prefix), { recursive: true, withFileTypes: true });
		return entries
			.filter((entry) => entry.isFile())
			.map((entry) => join(entry.parentPath, entry.name).slice(join(storageRoot, containerName).length + 1))
			.sort();
	}

	beforeAll(async () => {
		root = await mkdtemp(join(tmpdir(), 'cellix-video-encoding-it-'));
		storageRoot = join(root, 'storage');
		service = new ServiceVideoEncoding({
			blobStorage,
			ffmpegPath: ffmpeg,
			ffprobePath: ffprobe,
			packagerPath: PACKAGER_PATH,
			workingDirectory: join(root, 'work'),
		});
		await service.startUp();
	});

	afterAll(async () => {
		await service?.shutDown();
		await rm(root, { recursive: true, force: true });
	});

	it('encodes a 720p clip with audio and subtitles into playable DASH and HLS output', { timeout: 120_000 }, async () => {
		const srtPath = join(root, 'captions.srt');
		await writeFile(srtPath, '1\n00:00:00,500 --> 00:00:02,000\nHello\n\n2\n00:00:03,000 --> 00:00:04,500\nWorld\n');
		await storeSource('raw/landscape.mp4', [
			...['-f', 'lavfi', '-i', 'testsrc2=size=1280x720:rate=30'],
			...['-f', 'lavfi', '-i', 'sine=frequency=440:sample_rate=48000'],
			...['-i', srtPath, '-t', '5', '-map', '0:v', '-map', '1:a', '-map', '2:s'],
			...['-c:v', 'libx264', '-preset', 'ultrafast', '-c:a', 'aac', '-c:s', 'mov_text', '-metadata:s:s:0', 'language=eng'],
		]);

		const result = await service.encode({
			source: { containerName: 'uploads', blobName: 'raw/landscape.mp4' },
			destination: { containerName: 'videos', prefix: 'landscape/' },
		});

		expect(result.renditions.map((rendition) => `${rendition.width}x${rendition.height}`)).toEqual(['1280x720', '854x480', '640x360']);
		expect(result.hasAudio).toBe(true);
		expect(result.textTracks).toEqual([{ language: 'eng' }]);
		expect(result.durationSeconds).toBeCloseTo(5, 0);

		const blobs = await listBlobs('videos', 'landscape/');
		expect(blobs).toEqual(
			expect.arrayContaining([
				'landscape/manifest.mpd',
				'landscape/master.m3u8',
				'landscape/video/720/init.mp4',
				'landscape/video/720/1.m4s',
				'landscape/video/360/playlist.m3u8',
				'landscape/audio/init.mp4',
				'landscape/text/0/1.vtt',
			]),
		);

		const mpd = await readFile(join(storageRoot, 'videos', 'landscape/manifest.mpd'), 'utf8');
		expect(mpd).toMatch(/codecs="avc1\.[0-9a-f]+"[^>]*width="1280" height="720"/);
		expect(mpd).toContain('codecs="mp4a.40.2"');
		expect(mpd).toContain('initialization="video/720/init.mp4"');
		expect(mpd).toContain('mimeType="text/vtt"');

		const master = await readFile(join(storageRoot, 'videos', 'landscape/master.m3u8'), 'utf8');
		expect(master).toContain('RESOLUTION=1280x720');
		expect(master).toContain('RESOLUTION=640x360');
		expect(master).toContain('TYPE=SUBTITLES');
		expect(master).toContain('TYPE=AUDIO');

		const probed = JSON.parse(execFileSync(ffprobe, ['-v', 'error', '-print_format', 'json', '-show_streams', join(storageRoot, 'videos', 'landscape/master.m3u8')], { encoding: 'utf8' })) as {
			streams: { codec_name: string; width?: number }[];
		};
		expect(probed.streams.some((stream) => stream.codec_name === 'h264' && stream.width === 1280)).toBe(true);
		expect(probed.streams.some((stream) => stream.codec_name === 'aac')).toBe(true);
	});

	it('encodes a silent portrait clip with an untagged subtitle', { timeout: 120_000 }, async () => {
		const vttPath = join(root, 'captions.vtt');
		await writeFile(vttPath, 'WEBVTT\n\n00:00:00.500 --> 00:00:02.000\nHola\n');
		await storeSource('raw/portrait.mkv', [...['-f', 'lavfi', '-i', 'testsrc2=size=480x854:rate=25'], ...['-i', vttPath, '-t', '3', '-map', '0:v', '-map', '1:s', '-c:v', 'libx264', '-preset', 'ultrafast', '-c:s', 'webvtt']]);

		const result = await service.encode({
			source: { containerName: 'uploads', blobName: 'raw/portrait.mkv' },
			destination: { containerName: 'videos', prefix: 'portrait' },
		});

		expect(result.renditions.map((rendition) => `${rendition.width}x${rendition.height}`)).toEqual(['480x854', '360x640']);
		expect(result.hasAudio).toBe(false);
		expect(result.textTracks).toEqual([{ language: 'und' }]);

		const blobs = await listBlobs('videos', 'portrait/');
		expect(blobs).toContain('portrait/manifest.mpd');
		expect(blobs.some((name) => name.startsWith('portrait/audio/'))).toBe(false);
		expect(await readdir(join(root, 'work'))).toEqual([]);
	});
});
