import { join } from 'node:path';
import { ProcessTestServer } from '@cellix/serenity-framework/servers';
import { getAzuritePorts } from '@ocom-verification/verification-shared/environment';
import { appPaths } from '../shared/environment/app-paths.ts';

export const testAzuriteServer = new ProcessTestServer({
	cwd: appPaths.apiDir,
	executable: 'node',
	extraEnv: () => {
		const binDir = join(appPaths.apiDir, 'node_modules', '.bin');
		const { PATH: pathValue = '' } = process.env;
		return { PATH: `${binDir}:${pathValue}` };
	},
	getUrl: () => `http://127.0.0.1:${getAzuritePorts().blob}`,
	isReusableExit: (stderrOutput) => stderrOutput.includes('EADDRINUSE'),
	portsToCloseBeforeStart: () => getAzuritePorts().blob,
	probe: false,
	readyMarker: '[azurite] started',
	serverName: 'TestAzuriteServer',
	spawnArgs: ['start-azurite.mjs'],
});
