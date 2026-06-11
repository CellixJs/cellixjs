import { AzureFunctionsLocalSettings } from '@cellix/local-dev';
import { buildOcomApiLocalSettings } from '@ocom/local-dev-config';

new AzureFunctionsLocalSettings(buildOcomApiLocalSettings()).sync();
