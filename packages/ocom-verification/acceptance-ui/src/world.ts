import { registerManagedSerenityWorld } from '@cellix/serenity-framework/cucumber';
import { RenderInDom } from '@cellix/serenity-framework/dom/render-in-dom';
import { SerenityCast } from '@cellix/serenity-framework/serenity';
import { registerLifecycleHooks } from './cucumber-lifecycle-hooks.ts';

export const CellixUiWorld = registerManagedSerenityWorld<Record<string, never>>({
	infrastructure: {
		ensureStarted: () => Promise.resolve(),
		getState: () => ({}),
	},
	createCast: () =>
		new SerenityCast({
			useNotepad: true,
			abilities: [() => new RenderInDom()],
		}),
});

export type CellixUiWorld = InstanceType<typeof CellixUiWorld>;

registerLifecycleHooks();
