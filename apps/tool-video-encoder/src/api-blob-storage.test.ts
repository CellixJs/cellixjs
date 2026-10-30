import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, type Mock, vi } from 'vitest';
import { createApiBlobStorage } from './api-blob-storage.ts';
import type { OutputUploadLink } from './api-client.ts';

describe('createApiBlobStorage', () => {
	let dir: string;
	let requestOutputUploads: Mock<(videoId: string, paths: readonly string[]) => Promise<OutputUploadLink[]>>;
	let fetchMock: Mock<(url: string, init?: RequestInit) => Promise<Response>>;

	const storage = () => createApiBlobStorage({ api: { requestOutputUploads }, videoId: 'v1', sourceUrl: 'https://s/src?sig', outputPrefix: 'v1/', fetch: fetchMock as unknown as typeof fetch, batchDelayMs: 5 });

	beforeEach(async () => {
		dir = await mkdtemp(join(tmpdir(), 'encoder-client-'));
		requestOutputUploads = vi.fn((_videoId: string, paths: readonly string[]) => Promise.resolve(paths.map((path) => ({ path, url: `https://s/v1/${path}?sig` }))));
		fetchMock = vi.fn(() => Promise.resolve(new Response(null, { status: 201 })));
	});

	afterEach(async () => {
		await rm(dir, { recursive: true, force: true });
	});

	it('downloads the original from its read link to a file', async () => {
		fetchMock.mockResolvedValueOnce(new Response('original-bytes', { status: 200 }));
		const filePath = join(dir, 'source');

		await storage().downloadToFile({ containerName: 'ignored', blobName: 'ignored', filePath });

		expect(fetchMock).toHaveBeenCalledWith('https://s/src?sig', {});
		expect(await readFile(filePath, 'utf8')).toBe('original-bytes');
	});

	it('reports a missing original with a 404 status code', async () => {
		fetchMock.mockResolvedValueOnce(new Response('missing', { status: 404 }));

		await expect(storage().downloadToFile({ containerName: 'x', blobName: 'x', filePath: join(dir, 'source') })).rejects.toMatchObject({ statusCode: 404 });
	});

	it('requests upload links for concurrent uploads in one batch and PUTs each file', async () => {
		const blob = storage();
		const files = ['manifest.mpd', 'video/720/1.m4s', 'video/720/2.m4s'];
		for (const index of files.keys()) await writeFile(join(dir, String(index)), `file-${index}`);

		await Promise.all(files.map((name, index) => blob.uploadFile({ containerName: 'videos-c1', blobName: `v1/${name}`, filePath: join(dir, String(index)), httpHeaders: { blobContentType: 'video/mp4' } })));

		expect(requestOutputUploads).toHaveBeenCalledTimes(1);
		expect(requestOutputUploads).toHaveBeenCalledWith('v1', files);
		const [url, init] = fetchMock.mock.calls.find(([calledUrl]) => calledUrl === 'https://s/v1/video/720/1.m4s?sig') as [string, RequestInit];
		expect(url).toBe('https://s/v1/video/720/1.m4s?sig');
		expect(init).toMatchObject({ method: 'PUT', headers: { 'x-ms-blob-type': 'BlockBlob', 'Content-Type': 'video/mp4' } });
		expect(Buffer.from(init.body as Uint8Array).toString()).toBe('file-1');
	});

	it('refuses to upload outside the output prefix', async () => {
		await expect(storage().uploadFile({ containerName: 'videos-c1', blobName: 'v2/manifest.mpd', filePath: join(dir, 'x') })).rejects.toThrow('outside the output prefix');
		expect(requestOutputUploads).not.toHaveBeenCalled();
	});

	it('fails an upload when the API returns no link for it', async () => {
		requestOutputUploads.mockResolvedValueOnce([]);
		await writeFile(join(dir, 'f'), 'x');

		await expect(storage().uploadFile({ containerName: 'videos-c1', blobName: 'v1/manifest.mpd', filePath: join(dir, 'f') })).rejects.toThrow('no upload link for manifest.mpd');
	});

	it('reports a failed PUT with its status code', async () => {
		fetchMock.mockResolvedValueOnce(new Response('denied', { status: 403 }));
		await writeFile(join(dir, 'f'), 'x');

		await expect(storage().uploadFile({ containerName: 'videos-c1', blobName: 'v1/manifest.mpd', filePath: join(dir, 'f') })).rejects.toMatchObject({ statusCode: 403 });
	});
});
