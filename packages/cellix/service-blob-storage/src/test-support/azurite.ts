import { type ChildProcessWithoutNullStreams, spawn } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { createServer, Socket } from 'node:net';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const AZURITE_ACCOUNT_NAME = 'devstoreaccount1';
const AZURITE_ACCOUNT_KEY = 'Eby8vdM02xNOcqFlqUwJPLlmEtlCDXJ1OUzFT50uSRZ6IFsuFq2UVErCz4I6tq/K1SZFPTOtr/KBHBeksoGMGw==';

export interface AzuriteBlobServer {
	connectionString: string;
	stop: () => Promise<void>;
}

export async function startAzuriteBlobServer(): Promise<AzuriteBlobServer> {
	const port = await getAvailablePort();
	const location = mkdtempSync(join(tmpdir(), 'cellix-azurite-blob-'));
	let processHandle: ChildProcessWithoutNullStreams;
	let spawnError: unknown;
	try {
		processHandle = spawn('pnpm', ['exec', 'azurite-blob', '--silent', '--skipApiVersionCheck', '--blobPort', String(port), '--location', location], {
			cwd: findRepoRoot(),
			stdio: 'pipe',
			env: process.env,
		});
	} catch (err) {
		throw new Error(`Failed to spawn Azurite process: ${String(err)}`);
	}

	// capture asynchronous spawn errors (ENOENT, EACCES, etc.)
	processHandle.once('error', (err) => {
		spawnError = err;
	});

	await waitForAzuriteReady(processHandle, port, () => spawnError);

	return {
		connectionString: buildAzuriteConnectionString(port),
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

function buildAzuriteConnectionString(port: number): string {
	return `DefaultEndpointsProtocol=http;AccountName=${AZURITE_ACCOUNT_NAME};AccountKey=${AZURITE_ACCOUNT_KEY};BlobEndpoint=http://127.0.0.1:${port}/${AZURITE_ACCOUNT_NAME};`;
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
	const __dirname = dirname(fileURLToPath(import.meta.url));
	return join(__dirname, '..', '..', '..', '..');
}
