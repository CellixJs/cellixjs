import { getRedisPort } from '@cellix/local-dev';
import { ProcessTestServer } from '@cellix/serenity-framework/servers';
import { appPaths } from '../shared/environment/app-paths.ts';

const redisPort = getRedisPort();

export const testRedisServer = new ProcessTestServer({
	cwd: appPaths.redisMemoryMockDir,
	executable: 'pnpm',
	portsToCloseBeforeStart: redisPort,
	readyMarker: 'Redis Memory Server ready at:',
	serverName: 'TestRedisMemoryServer',
	spawnArgs: () => ['run', process.env['WORKTREE_NAME'] ? 'dev:worktree' : 'dev'],
	url: `redis://127.0.0.1:${redisPort}`,
});
