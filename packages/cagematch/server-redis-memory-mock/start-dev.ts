import { NodeDevRunner } from '@cellix/local-dev';

new NodeDevRunner({
	entry: 'src/start.ts',
	settings: {
		PORT: '51000',
	},
}).start();
