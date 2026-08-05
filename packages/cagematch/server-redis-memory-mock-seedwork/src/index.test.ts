import { createClient } from 'redis';
import { describe, expect, it } from 'vitest';
import { startRedisMemoryServer } from './index.ts';

describe('startRedisMemoryServer', () => {
	it('starts a real isolated Redis server and stops it idempotently', async () => {
		const started = await startRedisMemoryServer({ host: '127.0.0.1' });
		const client = createClient({ url: started.connectionString });

		try {
			await client.connect();
			expect(await client.ping()).toBe('PONG');
			await client.set('cagematch:test', 'working');
			expect(await client.get('cagematch:test')).toBe('working');
			expect(started.connectionString).toBe(`redis://127.0.0.1:${started.port}`);
		} finally {
			if (client.isOpen) {
				await client.quit();
			}
			await started.disposer.stop();
			await started.disposer.stop();
		}
	});
});
