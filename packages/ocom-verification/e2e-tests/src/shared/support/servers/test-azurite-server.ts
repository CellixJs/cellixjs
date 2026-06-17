import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { apiSettings } from '@ocom-verification/verification-shared/settings';
import { PortlessServer } from './portless-server.ts';

const accountName = 'devstoreaccount1';
const accountKey = createHash('sha256').update('cellix-azurite-test-account-key').digest('base64');
const blobPort = 10000;
const queuePort = 10001;
const tablePort = 10002;
const certDirectory = join(resolve(dirname(fileURLToPath(import.meta.url)), '../../../../target'), 'e2e-azurite-cert');
const certPath = join(certDirectory, 'azurite-cert.pem');
const keyPath = join(certDirectory, 'azurite-key.pem');

export function getAzuriteCertPath(): string {
	return certPath;
}

export class TestAzuriteServer extends PortlessServer {
	override async start(): Promise<void> {
		this.ensureCertificate();
		this.stopProcessesUsingAzuritePorts();
		await super.start();
	}

	protected get probeUrl() {
		return `https://127.0.0.1:${blobPort}/${accountName}`;
	}

	protected get readyMarker() {
		return 'Azurite Blob service is starting at';
	}

	protected get serverName() {
		return 'TestAzuriteServer';
	}

	protected override get executable() {
		return 'pnpm';
	}

	protected get spawnArgs() {
		return [
			'exec',
			'azurite',
			'--silent',
			'--skipApiVersionCheck',
			'--location',
			'../../__azurite__',
			'--blobPort',
			String(blobPort),
			'--queuePort',
			String(queuePort),
			'--tablePort',
			String(tablePort),
			'--oauth',
			'basic',
			'--cert',
			certPath,
			'--key',
			keyPath,
		];
	}

	protected get cwd() {
		return apiSettings.apiDir;
	}

	protected override get waitForProbeAfterReadyMarker() {
		return false;
	}

	protected override isProbeHealthy(_response: Response): boolean {
		return true;
	}

	protected override get extraEnv() {
		return {
			AZURITE_ACCOUNTS: `${accountName}:${accountKey}`,
		};
	}

	getUrl(): string {
		return `https://127.0.0.1:${blobPort}/${accountName}`;
	}

	getConnectionString(): string {
		return `DefaultEndpointsProtocol=https;AccountName=${accountName};AccountKey=${accountKey};BlobEndpoint=https://127.0.0.1:${blobPort}/${accountName};QueueEndpoint=https://127.0.0.1:${queuePort}/${accountName};TableEndpoint=https://127.0.0.1:${tablePort}/${accountName};`;
	}

	private ensureCertificate(): void {
		if (existsSync(certPath) && existsSync(keyPath)) {
			return;
		}

		mkdirSync(certDirectory, { recursive: true });
		execFileSync('openssl', ['req', '-x509', '-newkey', 'rsa:2048', '-sha256', '-nodes', '-days', '365', '-subj', '/CN=127.0.0.1', '-addext', 'subjectAltName=IP:127.0.0.1,DNS:localhost', '-keyout', keyPath, '-out', certPath], {
			stdio: 'ignore',
		});
	}

	private stopProcessesUsingAzuritePorts(): void {
		for (const port of [blobPort, queuePort, tablePort]) {
			let raw = '';
			try {
				raw = execFileSync('lsof', ['-ti', `tcp:${port}`], {
					stdio: ['ignore', 'pipe', 'ignore'],
					encoding: 'utf8',
				}).trim();
			} catch {
				raw = '';
			}

			if (!raw) {
				continue;
			}

			for (const pid of raw.split('\n')) {
				const parsedPid = Number(pid.trim());
				if (!Number.isNaN(parsedPid)) {
					process.kill(parsedPid, 'SIGKILL');
				}
			}
		}
	}
}
