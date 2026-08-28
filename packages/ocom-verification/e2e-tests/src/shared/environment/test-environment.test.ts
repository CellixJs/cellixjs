import { beforeEach, describe, expect, it, vi } from 'vitest';

const execFileSyncMock = vi.hoisted(() => ({
	fn: vi.fn(),
}));

vi.mock('node:child_process', async (importOriginal) => {
	const actual = await importOriginal<typeof import('node:child_process')>();
	return {
		...actual,
		execFileSync: execFileSyncMock.fn,
	};
});

vi.mock('./resolve-portless.ts', () => ({
	getPortlessPath: () => '/tmp/portless',
}));

describe('initTestEnvironment', () => {
	beforeEach(() => {
		execFileSyncMock.fn.mockReset();
		process.env.E2E = 'true';
	});

	it('ignores portless route-lock contention and still starts the proxy', async () => {
		execFileSyncMock.fn.mockImplementation((command: string, args: string[]) => {
			if (command === '/tmp/portless' && args[0] === 'prune') {
				throw new Error('Failed to acquire route lock');
			}
			return '';
		});

		const { cleanupTestEnvironment, initTestEnvironment } = await import('./test-environment.ts');
		cleanupTestEnvironment();
		initTestEnvironment();

		expect(execFileSyncMock.fn).toHaveBeenCalledWith(
			'/tmp/portless',
			['proxy', 'start', '--https', '-p', '1355'],
			expect.objectContaining({
				env: expect.objectContaining({ PORTLESS_WILDCARD: '0' }),
			}),
		);
	});
});
