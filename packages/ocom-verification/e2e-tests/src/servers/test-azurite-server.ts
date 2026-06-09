import { ProcessTestServer } from '@cellix/serenity-framework/servers';
import { getAzuritePorts } from '@ocom-verification/verification-shared/environment';
import { appPaths } from '../shared/environment/app-paths.ts';

export const testAzuriteServer = new ProcessTestServer({
	cwd: appPaths.apiDir,
	executable: 'pnpm',
	getUrl: () => `http://127.0.0.1:${getAzuritePorts().blob}`,
	isAlreadyRunning: async () => false,
	isReusableExit: (stderrOutput) => stderrOutput.includes('EADDRINUSE'),
	portsToCloseBeforeStart: () => getAzuritePorts().blob,
	probe: false,
	readyMarker: '[azurite] started',
	serverName: 'TestAzuriteServer',
	spawnArgs: ['run', 'azurite'],
});
