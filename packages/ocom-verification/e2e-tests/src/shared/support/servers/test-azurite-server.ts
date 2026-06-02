import { apiSettings } from '@ocom-verification/verification-shared/settings';
import { PortlessServer } from './portless-server.ts';

const accountName = 'devstoreaccount1';
const accountKey = 'Eby8vdM02xNOcqFlqUwJPLlmEtlCDXJ1OUzFT50uSRZ6IFsuFq2UVErCz4I6tq/K1SZFPTOtr/KBHBeksoGMGw==';
const blobPort = 10000;
const queuePort = 10001;
const tablePort = 10002;

export class TestAzuriteServer extends PortlessServer {
	protected get probeUrl() {
		return `http://127.0.0.1:${blobPort}/${accountName}`;
	}

	protected get readyMarker() {
		return 'Azurite Blob service is starting on';
	}

	protected get serverName() {
		return 'TestAzuriteServer';
	}

	protected get spawnArgs() {
		return ['run', 'azurite'];
	}

	protected get cwd() {
		return apiSettings.apiDir;
	}

	protected override isProbeHealthy(_response: Response): boolean {
		return true;
	}

	getUrl(): string {
		return `http://127.0.0.1:${blobPort}/${accountName}`;
	}

	getConnectionString(): string {
		return `DefaultEndpointsProtocol=http;AccountName=${accountName};AccountKey=${accountKey};BlobEndpoint=http://127.0.0.1:${blobPort}/${accountName};QueueEndpoint=http://127.0.0.1:${queuePort}/${accountName};TableEndpoint=http://127.0.0.1:${tablePort}/${accountName};`;
	}
}
