import type { VideoAwaitingEncoding } from '@ocom/video-encoder-client';
import { describe, expect, it, vi } from 'vitest';
import { runCli, Usage } from './cli.ts';

const video = (id: string, overrides: Partial<VideoAwaitingEncoding> = {}): VideoAwaitingEncoding => ({
	id,
	title: `Video ${id}`,
	status: 'UPLOADED',
	communityId: 'c1',
	communityName: 'Maple Grove',
	sourceSizeBytes: 5 * 1024 * 1024,
	failureMessage: null,
	createdAt: '2026-10-04T10:00:00.000Z',
	...overrides,
});

function setup(videos: VideoAwaitingEncoding[] = []) {
	const out: string[] = [];
	const err: string[] = [];
	const controller = new AbortController();
	const deps = {
		api: {
			ensureStaffUser: vi.fn(() => Promise.resolve({ id: 's1', displayName: 'Tia Admin' })),
			listAwaitingEncoding: vi.fn(() => Promise.resolve(videos)),
		},
		auth: { login: vi.fn(() => Promise.resolve({} as never)), logout: vi.fn(() => Promise.resolve()) },
		encode: vi.fn((_videoId: string, _options: { signal: AbortSignal; onProgress: (progress: { stage: 'encoding'; percent: number }) => void }) => Promise.resolve({})),
		out: (line: string) => out.push(line),
		err: (line: string) => err.push(line),
		signal: controller.signal,
	};
	return { deps, out, err, controller };
}

describe('runCli', () => {
	it.each([[[]], [['help']], [['--help']]])('prints usage for %j', async (argv) => {
		const { deps, out } = setup();

		await expect(runCli(argv, deps)).resolves.toBe(0);
		expect(out).toEqual([Usage]);
	});

	it('rejects an unknown command', async () => {
		const { deps, err } = setup();

		await expect(runCli(['transcode'], deps)).resolves.toBe(2);
		expect(err[0]).toContain('Unknown command: transcode');
	});

	it('logs in and confirms the staff user', async () => {
		const { deps, out } = setup();

		await expect(runCli(['login'], deps)).resolves.toBe(0);
		expect(deps.auth.login).toHaveBeenCalled();
		expect(out).toEqual(['Signed in as Tia Admin.']);
	});

	it('logs out', async () => {
		const { deps, out } = setup();

		await expect(runCli(['logout'], deps)).resolves.toBe(0);
		expect(deps.auth.logout).toHaveBeenCalled();
		expect(out).toEqual(['Signed out.']);
	});

	it('lists videos as a table with the last failure', async () => {
		const { deps, out } = setup([video('v1'), video('v22', { status: 'FAILED', communityName: null, failureMessage: 'No video stream' })]);

		await expect(runCli(['list'], deps)).resolves.toBe(0);
		expect(deps.api.ensureStaffUser).toHaveBeenCalled();
		expect(out).toEqual([
			'ID   STATUS    COMMUNITY    SIZE    UPLOADED    TITLE',
			'v1   UPLOADED  Maple Grove  5.0 MB  2026-10-04  Video v1',
			'v22  FAILED    c1           5.0 MB  2026-10-04  Video v22',
			'  last failure: No video stream',
		]);
	});

	it('says when nothing is waiting', async () => {
		const { deps, out } = setup();

		await expect(runCli(['list'], deps)).resolves.toBe(0);
		expect(out).toEqual(['No videos are waiting to be encoded.']);
	});

	it('encodes the given videos and reports progress every 10%', async () => {
		const { deps, out, err } = setup();
		deps.encode.mockImplementation((_videoId, options) => {
			for (const percent of [0, 3, 12, 19, 100]) options.onProgress({ stage: 'encoding', percent });
			return Promise.resolve({});
		});

		await expect(runCli(['encode', 'v1', 'v2'], deps)).resolves.toBe(0);
		expect(deps.encode.mock.calls.map(([videoId]) => videoId)).toEqual(['v1', 'v2']);
		expect(out).toEqual(['v1: ready', 'v2: ready']);
		expect(err.slice(0, 4)).toEqual(['[1/2] Encoding v1', '  encoding 0%', '  encoding 10%', '  encoding 100%']);
	});

	it('encodes every waiting video except those another encoder is working on', async () => {
		const { deps } = setup([video('v1'), video('v2', { status: 'ENCODING' }), video('v3', { status: 'FAILED' })]);

		await expect(runCli(['encode', '--all'], deps)).resolves.toBe(0);
		expect(deps.encode.mock.calls.map(([videoId]) => videoId)).toEqual(['v1', 'v3']);
	});

	it('keeps going after a failure and exits with 1', async () => {
		const { deps, out } = setup();
		deps.encode.mockRejectedValueOnce(new Error('The source has no video stream'));

		await expect(runCli(['encode', 'v1', 'v2'], deps)).resolves.toBe(1);
		expect(out).toEqual(['v1: failed - The source has no video stream', 'v2: ready']);
	});

	it('stops after the current video when interrupted', async () => {
		const { deps, err, controller } = setup();
		deps.encode.mockImplementationOnce(() => {
			controller.abort();
			return Promise.reject(new Error('Encoding was aborted'));
		});

		await expect(runCli(['encode', 'v1', 'v2'], deps)).resolves.toBe(1);
		expect(deps.encode).toHaveBeenCalledTimes(1);
		expect(err.at(-1)).toBe('Stopped. Videos that were not finished can be encoded again.');
	});

	it.each([[['encode']], [['encode', 'v1', '--all']]])('requires either IDs or --all (%j)', async (argv) => {
		const { deps, err } = setup();

		await expect(runCli(argv, deps)).resolves.toBe(2);
		expect(err[0]).toContain('Give video IDs or --all, not both.');
	});

	it('says when --all finds nothing to encode', async () => {
		const { deps, out } = setup([video('v2', { status: 'ENCODING' })]);

		await expect(runCli(['encode', '--all'], deps)).resolves.toBe(0);
		expect(out).toEqual(['No videos are waiting to be encoded.']);
	});

	it('reports API errors and exits with 1', async () => {
		const { deps, err } = setup();
		deps.api.ensureStaffUser.mockRejectedValueOnce(new Error('Unauthorized'));

		await expect(runCli(['list'], deps)).resolves.toBe(1);
		expect(err).toEqual(['Error: Unauthorized']);
	});
});
