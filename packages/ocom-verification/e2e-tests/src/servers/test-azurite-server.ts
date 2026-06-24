import { ProcessTestServer } from '@cellix/serenity-framework/servers';
import { getAzuritePorts } from '@ocom-verification/verification-shared/environment';
import { appPaths } from '../shared/environment/app-paths.ts';

const azuriteUrl = `http://127.0.0.1:${getAzuritePorts().blob}`;
const azuritePorts = () => {
	const { blob, queue, table } = getAzuritePorts();
	return [blob, queue, table];
};

export const testAzuriteServer = new ProcessTestServer({
	cwd: appPaths.apiDir,
	executable: 'pnpm',
	portsToCloseBeforeStart: azuritePorts,
	readyMarker: '[azurite] started',
	serverName: 'TestAzuriteServer',
	spawnArgs: ['run', 'azurite'],
	url: azuriteUrl,
});
