import { AzureFunctionsDevRunner } from '@cellix/local-dev';
import { buildOcomApiLocalSettings } from '@ocom/local-dev-config';

new AzureFunctionsDevRunner({
	localSettings: buildOcomApiLocalSettings(),
}).start();
