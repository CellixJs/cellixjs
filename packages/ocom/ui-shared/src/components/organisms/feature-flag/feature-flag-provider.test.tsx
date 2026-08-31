import { act, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { type FeatureFlagConfig, FeatureFlagProvider } from './feature-flag-provider.tsx';
import { useFeatureFlags } from './use-feature-flags.tsx';

const fallbackFlagValues = {
	FeatureFlags: [{ Name: 'FALLBACK_FLAG', Value: 'fallback' }],
};

const remoteFlagValues = {
	FeatureFlags: [{ Name: 'REMOTE_FLAG', Value: 'remote' }],
};

function FeatureFlagReader({ name }: { name: string }) {
	const { GetFeatureFlagByName } = useFeatureFlags();

	return <output>{GetFeatureFlagByName(name)}</output>;
}

function Provider({ config, children }: { config: FeatureFlagConfig; children: ReactNode }) {
	return <FeatureFlagProvider config={config}>{children}</FeatureFlagProvider>;
}

describe('FeatureFlagProvider', () => {
	let container: HTMLDivElement;
	let root: ReturnType<typeof createRoot>;

	beforeEach(() => {
		container = document.createElement('div');
		document.body.appendChild(container);
		root = createRoot(container);
	});

	afterEach(() => {
		act(() => {
			root.unmount();
		});
		container.remove();
		vi.unstubAllGlobals();
		vi.useRealTimers();
	});

	it('loads remote flags and returns configured and missing values through the hook', async () => {
		const fetchMock = vi.fn().mockResolvedValue({
			ok: true,
			json: vi.fn().mockResolvedValue(remoteFlagValues),
		});
		vi.stubGlobal('fetch', fetchMock);

		await render(
			<Provider config={{ url: 'https://flags.example.com/OCM_Feature_Flag_PROD.json', fallbackFlagValues }}>
				<FeatureFlagReader name="REMOTE_FLAG" />
			</Provider>,
		);

		expect(fetchMock).toHaveBeenCalledOnce();
		expect(fetchMock).toHaveBeenCalledWith(expect.stringMatching(/^https:\/\/flags\.example\.com\/OCM_Feature_Flag_PROD\.json\?\d+$/), { cache: 'no-store' });
		expect(container.querySelector('output')?.textContent).toBe('remote');

		await render(
			<Provider config={{ url: '', fallbackFlagValues }}>
				<FeatureFlagReader name="MISSING_FLAG" />
			</Provider>,
		);

		expect(container.querySelector('output')?.textContent).toBe('');
	});

	it('uses local fallback values when configuration is missing or unavailable', async () => {
		vi.useFakeTimers();
		const fetchMock = vi.fn().mockRejectedValue(new Error('Blob unavailable'));
		vi.stubGlobal('fetch', fetchMock);

		await render(
			<Provider config={{ url: '', fallbackFlagValues }}>
				<FeatureFlagReader name="FALLBACK_FLAG" />
			</Provider>,
		);

		expect(fetchMock).not.toHaveBeenCalled();
		expect(container.querySelector('output')?.textContent).toBe('fallback');

		await render(
			<Provider config={{ url: 'https://flags.example.com/OCM_Feature_Flag_PROD.json', fallbackFlagValues }}>
				<FeatureFlagReader name="FALLBACK_FLAG" />
			</Provider>,
		);

		await advanceRetryTimers();

		expect(fetchMock).toHaveBeenCalledTimes(4);
		expect(container.querySelector('output')?.textContent).toBe('fallback');
	});

	it('uses local fallback values when the remote JSON cannot be parsed', async () => {
		vi.useFakeTimers();
		const fetchMock = vi.fn().mockResolvedValue({
			ok: true,
			json: vi.fn().mockRejectedValue(new SyntaxError('Unexpected end of JSON input')),
		});
		vi.stubGlobal('fetch', fetchMock);

		await render(
			<Provider config={{ url: 'https://flags.example.com/OCM_Feature_Flag_PROD.json', fallbackFlagValues }}>
				<FeatureFlagReader name="FALLBACK_FLAG" />
			</Provider>,
		);

		await advanceRetryTimers();

		expect(fetchMock).toHaveBeenCalledTimes(4);
		expect(container.querySelector('output')?.textContent).toBe('fallback');
	});

	it('uses cached remote flags during the half-TTL refresh interval', async () => {
		vi.useFakeTimers();
		const fetchMock = vi.fn().mockResolvedValue({
			ok: true,
			json: vi.fn().mockResolvedValue(remoteFlagValues),
		});
		vi.stubGlobal('fetch', fetchMock);

		await render(
			<Provider config={{ cache: 100, url: 'https://flags.example.com/OCM_Feature_Flag_PROD.json', fallbackFlagValues }}>
				<FeatureFlagReader name="REMOTE_FLAG" />
			</Provider>,
		);

		await act(async () => {
			await vi.advanceTimersByTimeAsync(50);
		});

		expect(fetchMock).toHaveBeenCalledOnce();
		expect(container.querySelector('output')?.textContent).toBe('remote');
	});

	it('uses local fallback values in Storybook without fetching remote configuration', async () => {
		globalThis.history.pushState({}, '', '/iframe.html');
		const fetchMock = vi.fn();
		vi.stubGlobal('fetch', fetchMock);

		await render(
			<Provider config={{ url: 'https://flags.example.com/OCM_Feature_Flag_PROD.json', fallbackFlagValues }}>
				<FeatureFlagReader name="FALLBACK_FLAG" />
			</Provider>,
		);

		expect(fetchMock).not.toHaveBeenCalled();
		expect(container.querySelector('output')?.textContent).toBe('fallback');
		globalThis.history.pushState({}, '', '/');
	});

	async function render(children: ReactNode): Promise<void> {
		await act(async () => {
			root.render(children);
			await Promise.resolve();
			await Promise.resolve();
		});
	}

	async function advanceRetryTimers(): Promise<void> {
		await act(async () => {
			await vi.advanceTimersByTimeAsync(14_000);
		});
	}
});
