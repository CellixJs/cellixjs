import { type ChildProcessWithoutNullStreams, spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { createServer, Socket } from 'node:net';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { BlobClient, BlobServiceClient } from '@azure/storage-blob';
import { ServiceClientBlobStorage } from '@cellix/service-blob-storage';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

describe('ServiceClientBlobStorage integration with Azurite', () => {
	let azurite: AzuriteBlobServer;
	let service: ServiceClientBlobStorage;
	const accountName = 'devstoreaccount1';

	beforeAll(async () => {
		azurite = await startAzuriteBlobServer();
		service = new ServiceClientBlobStorage({
			accountName,
			signingConnectionString: azurite.connectionString,
		});
		await service.startUp();
	});

	afterAll(async () => {
		if (service) {
			await service.shutDown();
		}
		if (azurite) {
			await azurite.stop();
		}
	});

	it('uploads, lists, and generates read SAS tokens against Azurite', async () => {
		const containerName = `cellix-${Date.now()}`;
		const blobName = 'folder/test.txt';
		const text = 'hello from azurite';
		const expiresOn = new Date(Date.now() + 5 * 60_000);

		const blobServiceClient = BlobServiceClient.fromConnectionString(azurite.connectionString);

		let containerCreated = false;
		for (let attempt = 0; attempt < 3; attempt++) {
			try {
				await blobServiceClient.getContainerClient(containerName).create();
				containerCreated = true;
				break;
			} catch (_error) {
				if (attempt < 2) {
					await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)));
				}
			}
		}

		if (!containerCreated) {
			throw new Error('Failed to create container with Azurite');
		}

		await service.uploadText({
			containerName,
			blobName,
			text,
			httpHeaders: { blobContentType: 'text/plain' },
			metadata: { source: 'integration-test' },
			tags: { scope: 'framework' },
		});

		const blobs = await service.listBlobs({
			containerName,
			prefix: 'folder/',
		});
		expect(blobs.map((blob) => blob.name)).toEqual([blobName]);
		expect(blobs[0]?.url).toContain(`/${containerName}/${blobName}`);

		const readSasToken = await service.generateReadSasToken({
			containerName,
			blobName,
			expiresOn,
		});
		expect(readSasToken).toContain('sig=');

		const blobUrl = blobServiceClient.getContainerClient(containerName).getBlockBlobClient(blobName).url;
		const readSasUrl = `${blobUrl}?${readSasToken}`;
		const sasReadClient = new BlobClient(readSasUrl);
		const downloadResponse = await sasReadClient.download();
		const downloadedText = await streamToString(downloadResponse.readableStreamBody);
		expect(downloadedText).toBe(text);

		await service.deleteBlob({
			containerName,
			blobName,
		});

		const remainingNames: string[] = [];
		for await (const blob of blobServiceClient.getContainerClient(containerName).listBlobsFlat({ prefix: 'folder/' })) {
			remainingNames.push(blob.name);
		}
		expect(remainingNames).toEqual([]);
	});
});

async function streamToString(stream: NodeJS.ReadableStream | null | undefined): Promise<string> {
	if (!stream) {
		throw new Error('Expected a readable stream from blob download');
	}

	const chunks: Buffer[] = [];
	for await (const chunk of stream) {
		chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
	}
	return Buffer.concat(chunks).toString('utf8');
}

interface AzuriteBlobServer {
	connectionString: string;
	stop: () => Promise<void>;
}

async function startAzuriteBlobServer(): Promise<AzuriteBlobServer> {
	const accountName = 'devstoreaccount1';
	const accountKey = createHash('sha256').update('cellix-azurite-test-account-key').digest('base64');
	const port = await getAvailablePort();
	const location = mkdtempSync(join(tmpdir(), 'cellix-azurite-blob-'));
	let processHandle: ChildProcessWithoutNullStreams;
	let spawnError: unknown;

	const azuriteBinaryPath = join(findRepoRoot(), 'node_modules', '.bin', 'azurite-blob');

	try {
		processHandle = spawn(azuriteBinaryPath, ['--silent', '--skipApiVersionCheck', '--blobPort', String(port), '--location', location], {
			stdio: 'pipe',
			env: {
				...process.env,
				AZURITE_ACCOUNTS: `${accountName}:${accountKey}`,
			},
		});
	} catch (error) {
		throw new Error(`Failed to spawn Azurite process (binary at ${azuriteBinaryPath}): ${String(error)}`);
	}

	processHandle.once('error', (error) => {
		spawnError = error;
	});

	await waitForAzuriteReady(processHandle, port, () => spawnError);

	return {
		connectionString: `DefaultEndpointsProtocol=http;AccountName=${accountName};AccountKey=${accountKey};BlobEndpoint=http://127.0.0.1:${port}/${accountName};`,
		stop: async () => {
			await stopProcess(processHandle);
			rmSync(location, { recursive: true, force: true });
		},
	};
}

async function getAvailablePort(): Promise<number> {
	return await new Promise((resolve, reject) => {
		const server = createServer();
		server.listen(0, '127.0.0.1', () => {
			const address = server.address();
			if (!address || typeof address === 'string') {
				server.close();
				reject(new Error('Could not allocate a TCP port for Azurite'));
				return;
			}

			const { port } = address;
			server.close((error) => {
				if (error) {
					reject(error);
					return;
				}
				resolve(port);
			});
		});
		server.on('error', reject);
	});
}

async function waitForAzuriteReady(processHandle: ChildProcessWithoutNullStreams, port: number, getSpawnError?: () => unknown): Promise<void> {
	const startedAt = Date.now();
	let lastError: unknown;

	while (Date.now() - startedAt < 10_000) {
		if (getSpawnError?.()) {
			throw new Error(`Failed to spawn Azurite process: ${String(getSpawnError())}`);
		}

		if (processHandle.exitCode !== null) {
			const stderr = processHandle.stderr.read()?.toString() ?? '';
			throw new Error(`Azurite exited before becoming ready: ${stderr}`);
		}

		try {
			await canConnect(port);
			return;
		} catch (error) {
			lastError = error;
			await delay(100);
		}
	}

	throw new Error(`Timed out waiting for Azurite to start on port ${port}: ${String(lastError)}`);
}

async function canConnect(port: number): Promise<void> {
	await new Promise<void>((resolve, reject) => {
		const connection = new Socket();
		connection.setTimeout(200);
		connection.once('error', reject);
		connection.once('timeout', () => {
			connection.destroy();
			reject(new Error('Timed out connecting to Azurite'));
		});
		connection.connect(port, '127.0.0.1', () => {
			connection.end();
			resolve();
		});
	});
}

async function stopProcess(processHandle: ChildProcessWithoutNullStreams): Promise<void> {
	if (processHandle.exitCode !== null) {
		return;
	}

	processHandle.kill('SIGTERM');
	await new Promise<void>((resolve) => {
		processHandle.once('exit', () => resolve());
		setTimeout(() => {
			if (processHandle.exitCode === null) {
				processHandle.kill('SIGKILL');
			}
			resolve();
		}, 2_000);
	});
}

function delay(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

function findRepoRoot(): string {
	const currentDir = dirname(fileURLToPath(import.meta.url));

	const { REPO_ROOT } = process.env;
	if (REPO_ROOT && existsSync(join(REPO_ROOT, 'pnpm-workspace.yaml'))) {
		return REPO_ROOT;
	}

	let current = currentDir;
	let previous = '';
	while (current !== previous) {
		if (existsSync(join(current, 'pnpm-workspace.yaml'))) {
			return current;
		}
		previous = current;
		current = dirname(current);
	}

	throw new Error(`Could not find monorepo root from ${currentDir}`);
}
