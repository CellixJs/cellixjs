import { registerWorldLifecycleHooks } from '@cellix/serenity-framework/cucumber';
import { unmountComponent } from '@cellix/serenity-framework/jsdom/react-render';
import { getTimeout } from '@cellix/serenity-framework/settings';
import { After } from '@cucumber/cucumber';
import type { CellixUiWorld } from '../world.ts';

registerWorldLifecycleHooks<CellixUiWorld>({
	scenarioTimeout: getTimeout('scenario'),
	beforeTimeout: getTimeout('uiInit'),
	before: async (world) => {
		await world.init();
	},
});

After({ timeout: getTimeout('uiCleanup') }, () => {
	unmountComponent();
});
