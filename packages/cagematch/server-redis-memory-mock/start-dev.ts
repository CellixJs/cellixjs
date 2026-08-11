import { NodeDevRunner } from '@cellix/local-dev';

new NodeDevRunner({
	settings: {
		PORT: '55000',
	},
}).start();
