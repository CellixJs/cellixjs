import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { WorkerConfig } from './config.ts';

const { created, startOrder, stopOrder, failingStart } = vi.hoisted(() => ({
	created: [] as { kind: string; options: unknown; instance: unknown }[],
	startOrder: [] as string[],
	stopOrder: [] as string[],
	failingStart: { kind: undefined as string | undefined },
}));

function fakeService(kind: string) {
	return class {
		public readonly loggingArgs: unknown[] = [];
		public readonly options: unknown;
		constructor(options: unknown) {
			this.options = options;
			created.push({ kind, options, instance: this });
		}
		startUp() {
			startOrder.push(kind);
			return failingStart.kind === kind ? Promise.reject(new Error(`${kind} failed`)) : Promise.resolve(this);
		}
		shutDown() {
			stopOrder.push(kind);
			return Promise.resolve();
		}
		enableLogging(...args: unknown[]) {
			this.loggingArgs.push(...args);
			return this;
		}
	};
}

vi.mock('@ocom/service-blob-storage', () => ({
	ServiceBlobStorage: fakeService('blob-managed-identity'),
	ServiceClientBlobStorage: fakeService('blob-connection-string'),
}));
vi.mock('@ocom/service-queue-storage', () => ({ ServiceVideoWorkerQueueStorage: fakeService('queue') }));
vi.mock('@ocom/service-video-encoding', () => ({ ServiceVideoEncoding: fakeService('encoder') }));

const { startWorkerServices } = await import('./services.ts');

const config: WorkerConfig = {
	mode: 'once',
	storage: { accountName: 'ocmdevstapp', connectionString: undefined },
	encoder: { ffmpegPath: '/usr/bin/ffmpeg', ffprobePath: undefined, packagerPath: '/usr/local/bin/packager', workingDirectory: '/mnt/scratch' },
	queue: { visibilityTimeoutSeconds: 300, maxDequeueCount: 5 },
	pollIntervalSeconds: 5,
};

const find = (kind: string) => created.find((entry) => entry.kind === kind);

describe('startWorkerServices', () => {
	beforeEach(() => {
		created.length = 0;
		startOrder.length = 0;
		stopOrder.length = 0;
		failingStart.kind = undefined;
	});

	it('uses managed identity by account name when there is no connection string', async () => {
		await startWorkerServices(config);

		expect(find('blob-managed-identity')?.options).toEqual({ accountName: 'ocmdevstapp' });
		expect(find('queue')?.options).toEqual({ accountName: 'ocmdevstapp' });
		expect(find('blob-connection-string')).toBeUndefined();
	});

	it('uses the connection string for blobs and queues in local development', async () => {
		await startWorkerServices({ ...config, storage: { accountName: 'devstoreaccount1', connectionString: 'UseDevelopmentStorage=true' } });

		expect(find('blob-connection-string')?.options).toEqual({ accountName: 'devstoreaccount1', signingConnectionString: 'UseDevelopmentStorage=true' });
		expect(find('queue')?.options).toEqual({ connectionString: 'UseDevelopmentStorage=true' });
	});

	it('gives the encoder the blob service and executable settings, and logs queue messages to queue-logs', async () => {
		await startWorkerServices(config);

		const blob = find('blob-managed-identity')?.instance;
		expect(find('encoder')?.options).toEqual({ blobStorage: blob, ...config.encoder });
		expect((find('queue')?.instance as { loggingArgs: unknown[] }).loggingArgs).toEqual([blob, { enabled: true, container: 'queue-logs', await: false }]);
	});

	it('starts storage before the encoder and shuts down in reverse order', async () => {
		const services = await startWorkerServices(config);
		await services.shutDown();

		expect(startOrder).toEqual(['blob-managed-identity', 'queue', 'encoder']);
		expect(stopOrder).toEqual(['encoder', 'queue', 'blob-managed-identity']);
	});

	it('shuts down already-started services and rethrows when one fails to start', async () => {
		failingStart.kind = 'encoder';

		await expect(startWorkerServices(config)).rejects.toThrow('encoder failed');
		expect(stopOrder).toEqual(['queue', 'blob-managed-identity']);
	});
});
