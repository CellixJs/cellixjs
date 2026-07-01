import { afterEach, describe, expect, it, vi } from 'vitest';
import type { TestServer } from '../servers/index.ts';
import { ApiInfrastructure, E2EInfrastructure } from './index.ts';

class FakeServer implements TestServer {
	private running = false;

	start(): Promise<void> {
		this.running = true;
		return Promise.resolve();
	}

	stop(): Promise<void> {
		this.running = false;
		return Promise.resolve();
	}

	isRunning(): boolean {
		return this.running;
	}

	getUrl(): string {
		return 'process://fake';
	}
}

describe('infrastructure shutdown handlers', () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('removes stopped API infrastructure instances from the process shutdown registry', async () => {
		const once = vi.spyOn(process, 'once').mockImplementation(() => process);

		const first = ApiInfrastructure.create().addServer('api', new FakeServer()).finalize();
		expect(once).toHaveBeenCalledTimes(2);

		await first.stopAll();

		ApiInfrastructure.create().addServer('api', new FakeServer()).finalize();
		expect(once).toHaveBeenCalledTimes(4);
	});

	it('removes stopped E2E infrastructure instances from the process shutdown registry', async () => {
		const once = vi.spyOn(process, 'once').mockImplementation(() => process);

		const first = E2EInfrastructure.create().addServer('api', new FakeServer()).finalize();
		expect(once).toHaveBeenCalledTimes(2);

		await first.stopAll();

		E2EInfrastructure.create().addServer('api', new FakeServer()).finalize();
		expect(once).toHaveBeenCalledTimes(4);
	});
});
