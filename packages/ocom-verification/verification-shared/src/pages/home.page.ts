import type { ElementHandle, PageAdapter } from './page-adapter.ts';

/**
 * Home page object — represents the landing screen that contains the
 * site header with sign-in controls. Works with both jsdom (acceptance
 * UI tests) and Playwright (e2e tests) via the PageAdapter abstraction.
 */
export class HomePage {
	constructor(private readonly adapter: PageAdapter) {}

	get signInButton(): ElementHandle {
		return this.adapter.getByRole('button', { name: /Log In|Sign In/i });
	}

	async clickSignIn(): Promise<void> {
		await this.signInButton.click();
	}
}
