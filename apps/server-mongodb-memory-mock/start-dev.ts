import { NodeDevRunner } from '@cellix/local-dev';

new NodeDevRunner({
	settings: {
		PORT: '50000',
	},
}).start();
