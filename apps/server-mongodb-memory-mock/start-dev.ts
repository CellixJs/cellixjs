import { getMongoPort, runTsxDev } from '@cellix/local-dev';

runTsxDev({
	env: {
		...process.env,
		PORT: String(getMongoPort(process.env['WORKTREE_NAME'])),
	},
});
