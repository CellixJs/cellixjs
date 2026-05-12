import { After, Before } from '@cucumber/cucumber';
import type { CellixUiWorld } from '../../world.ts';
import { unmountComponent } from './ui/react-render.tsx';

Before({ timeout: 30_000 }, async function (this: CellixUiWorld) {
	await this.init();
});

After({ timeout: 10_000 }, async () => {
	await unmountComponent();
});
