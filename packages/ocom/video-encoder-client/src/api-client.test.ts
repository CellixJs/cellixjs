import { describe, expect, it, vi } from 'vitest';
import { createEncoderApiClient, EncoderApiError } from './api-client.ts';

function makeClient(responses: unknown[], status = 200) {
	const calls: { url: string; init: RequestInit }[] = [];
	const fetchMock = vi.fn((url: string, init: RequestInit) => {
		calls.push({ url, init });
		return Promise.resolve(new Response(JSON.stringify(responses.shift()), { status }));
	});
	const api = createEncoderApiClient({ apiUrl: 'https://api.test/graphql', getAccessToken: () => Promise.resolve('token-1'), fetch: fetchMock as unknown as typeof fetch });
	const body = (index: number) => JSON.parse(String(calls[index]?.init.body)) as { query: string; variables: Record<string, unknown> };
	return { api, calls, body };
}

const ok = { status: { success: true, errorMessage: null } };

describe('createEncoderApiClient', () => {
	it('sends the staff token and returns the staff user', async () => {
		const { api, calls, body } = makeClient([{ data: { currentStaffUserAndCreateIfNotExists: { id: 's1', displayName: 'Tia Admin' } } }]);

		await expect(api.ensureStaffUser()).resolves.toEqual({ id: 's1', displayName: 'Tia Admin' });
		expect(calls[0]?.url).toBe('https://api.test/graphql');
		expect(calls[0]?.init.headers).toMatchObject({ Authorization: 'Bearer token-1', 'Content-Type': 'application/json' });
		expect(body(0).query).toContain('currentStaffUserAndCreateIfNotExists');
	});

	it('lists videos awaiting encoding', async () => {
		const videos = [{ id: 'v1', title: 'Board meeting', status: 'UPLOADED', communityId: 'c1', communityName: 'Maple', sourceSizeBytes: 10, failureMessage: null, createdAt: '2026-10-05' }];
		const { api } = makeClient([{ data: { videosAwaitingEncoding: videos } }]);

		await expect(api.listAwaitingEncoding()).resolves.toEqual(videos);
	});

	it('starts encoding and returns the source link and destination', async () => {
		const encoding = { sourceUrl: 'https://s/src?sig', outputContainerName: 'videos-c1', outputPrefix: 'v1/' };
		const { api, body } = makeClient([{ data: { videoStartEncoding: { ...ok, encoding } } }]);

		await expect(api.startEncoding('v1')).resolves.toEqual(encoding);
		expect(body(0).variables).toEqual({ input: { id: 'v1' } });
	});

	it('requests output upload links for paths', async () => {
		const uploads = [{ path: 'manifest.mpd', url: 'https://s/v1/manifest.mpd?sig' }];
		const { api, body } = makeClient([{ data: { videoRequestOutputUploads: { ...ok, uploads } } }]);

		await expect(api.requestOutputUploads('v1', ['manifest.mpd'])).resolves.toEqual(uploads);
		expect(body(0).variables).toEqual({ input: { id: 'v1', paths: ['manifest.mpd'] } });
	});

	it('records success and failure results', async () => {
		const { api, body } = makeClient([{ data: { videoRecordEncodingResult: ok } }, { data: { videoRecordEncodingResult: ok } }]);
		const report = { dashManifestPath: 'manifest.mpd', hlsManifestPath: 'master.m3u8', durationSeconds: 12.5, renditionHeights: [720] };

		await api.recordSucceeded('v1', report);
		await api.recordFailed('v1', { code: 'encode-failed', message: 'ffmpeg failed' });

		expect(body(0).variables).toEqual({ input: { id: 'v1', succeeded: report } });
		expect(body(1).variables).toEqual({ input: { id: 'v1', failed: { code: 'encode-failed', message: 'ffmpeg failed' } } });
	});

	it('throws the mutation error message when a mutation fails', async () => {
		const { api } = makeClient([{ data: { videoStartEncoding: { status: { success: false, errorMessage: 'You do not have permission to encode videos' }, encoding: null } } }]);

		await expect(api.startEncoding('v1')).rejects.toThrow(new EncoderApiError('You do not have permission to encode videos'));
	});

	it('throws GraphQL errors', async () => {
		const { api } = makeClient([{ errors: [{ message: 'Unauthorized' }] }]);

		await expect(api.listAwaitingEncoding()).rejects.toThrow('Unauthorized');
	});

	it('throws on HTTP errors with the status', async () => {
		const { api } = makeClient([{}], 502);

		await expect(api.listAwaitingEncoding()).rejects.toMatchObject({ name: 'EncoderApiError', status: 502 });
	});
});
