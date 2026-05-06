import { After, Before, setDefaultTimeout } from '@cucumber/cucumber';
import { getTimeout } from '@ocom-verification/verification-shared/settings';
import type { CellixUiWorld } from '../../world.ts';
import { unmountComponent } from './ui/react-render.ts';

/** Default scenario timeout from centralized configuration */
setDefaultTimeout(getTimeout('scenario'));

Before({ timeout: getTimeout('uiInit') }, async function (this: CellixUiWorld) {
	await this.init();
});

After({ timeout: getTimeout('uiCleanup') }, () => {
	unmountComponent();
});
