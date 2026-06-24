import { registerWorldLifecycleHooks } from '@cellix/serenity-framework/cucumber';
import { RenderInDom } from '@cellix/serenity-framework/dom/render-in-dom';
import { getTimeout } from '@cellix/serenity-framework/settings';
import { After } from '@cucumber/cucumber';
import { actorInTheSpotlight } from '@serenity-js/core';
import type { CellixUiWorld } from './world.ts';

/** Register the Cucumber Before/After hooks for the component acceptance suite. */
export function registerLifecycleHooks(): void {
	registerWorldLifecycleHooks<CellixUiWorld>({
		scenarioTimeout: getTimeout('scenario'),
		beforeTimeout: getTimeout('uiInit'),
		before: async (world) => {
			await world.init();
		},
	});

	After({ timeout: getTimeout('uiCleanup') }, () => {
		try {
			RenderInDom.as(actorInTheSpotlight()).unmount();
		} catch {
			/* No component was rendered in this scenario. */
		}
	});
}
