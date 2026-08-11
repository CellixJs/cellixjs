import { NodeDevRunner } from '@cellix/local-dev';

new NodeDevRunner({
	entry: 'src/start.ts',
	settings: {
		// NodeDevRunner adds the deterministic worktree offset. This separate
		// base keeps Redis out of MongoDB's 50000-54900 worktree port band.
		PORT: '55000',
	},
}).start();
