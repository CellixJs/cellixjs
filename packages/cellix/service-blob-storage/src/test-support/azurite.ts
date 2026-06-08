import { createHash } from 'node:crypto';
import { type ChildProcessWithoutNullStreams, spawn } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { createServer, Socket } from 'node:net';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const azuriteAccountName = 'devstoreaccount1';

/**
 * Deterministic non-secret test credential for Azurite and SharedKey signing tests.
 *
 * The value is generated from a fixed label so it is stable across runs without
 * embedding a literal account key in source code.
 */
export function getAzuriteAccountKey(): string {
	return createHash('sha256').update('cellix-azurite-test-account-key').digest('base64');
}

export interface AzuriteBlobServer {
	connectionString: string;
	stop: () => Promise<void>;
}

export async function startAzuriteBlobServer(): Promise<AzuriteBlobServer> {
	const port = await getAvailablePort();
	const location = mkdtempSync(join(tmpdir(), 'cellix-azurite-blob-'));
	const accountKey = getAzuriteAccountKey();
	let processHandle: ChildProcessWithoutNullStreams;
	let spawnError: unknown;

	const azuriteBinaryPath = join(findRepoRoot(), 'node_modules', '.bin', 'azurite-blob');

	try {
		processHandle = spawn(azuriteBinaryPath, ['--silent', '--skipApiVersionCheck', '--blobPort', String(port), '--location', location], {
			stdio: 'pipe',
			env: {
				...process.env,
				AZURITE_ACCOUNTS: `${azuriteAccountName}:${accountKey}`,
			},
		});
	} catch (err) {
		throw new Error(`Failed to spawn Azurite process (binary at ${azuriteBinaryPath}): ${String(err)}`);
	}

	processHandle.once('error', (err) => {
		spawnError = err;
	});

	await waitForAzuriteReady(processHandle, port, () => spawnError);

	return {
		connectionString: `DefaultEndpointsProtocol=http;AccountName=${azuriteAccountName};AccountKey=${accountKey};BlobEndpoint=http://127.0.0.1:${port}/${azuriteAccountName};`,
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
	const __dirname = dirname(fileURLToPath(import.meta.url));

	const { REPO_ROOT } = process.env;
	if (REPO_ROOT && existsSync(join(REPO_ROOT, 'pnpm-workspace.yaml'))) {
		return REPO_ROOT;
	}

	let current = __dirname;
	let previous = '';
	while (current !== previous) {
		if (existsSync(join(current, 'pnpm-workspace.yaml'))) {
			return current;
		}
		previous = current;
		current = dirname(current);
	}

	throw new Error(`Could not find monorepo root. Expected pnpm-workspace.yaml in a parent directory of ${__dirname}, or set REPO_ROOT environment variable.`);
}
