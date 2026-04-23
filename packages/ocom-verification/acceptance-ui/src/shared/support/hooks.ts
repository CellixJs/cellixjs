import { After, Before } from '@cucumber/cucumber';
import { unmountComponent } from './ui/react-render.tsx';

Before({ timeout: 30_000 }, async function () {
	await this.init?.();
});

After({ timeout: 10_000 }, async () => {
	await unmountComponent();
});
