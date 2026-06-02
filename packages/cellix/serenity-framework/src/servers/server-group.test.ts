import { describe, expect, it } from 'vitest';
import { type TestServer, TestServerGroup } from './index.ts';

class RecordingServer implements TestServer {
	private readonly name: string;
	private readonly calls: string[];

	constructor(name: string, calls: string[]) {
		this.name = name;
		this.calls = calls;
	}

	start(): Promise<void> {
		this.calls.push(`start:${this.name}`);
		return Promise.resolve();
	}

	stop(): Promise<void> {
		this.calls.push(`stop:${this.name}`);
		return Promise.resolve();
	}

	isRunning(): boolean {
		return false;
	}

	getUrl(): string {
		return `https://${this.name}.example.test`;
	}
}

describe('TestServerGroup', () => {
	it('starts required servers before variable UI portals and stops in reverse groups', async () => {
		const calls: string[] = [];
		const group = new TestServerGroup({
			required: [new RecordingServer('api', calls), new RecordingServer('auth', calls)],
			uiPortals: [new RecordingServer('community', calls), new RecordingServer('staff', calls)],
		});

		await group.start();
		await group.stop();

		expect(calls).toEqual(['start:api', 'start:auth', 'start:community', 'start:staff', 'stop:staff', 'stop:community', 'stop:auth', 'stop:api']);
	});
});
