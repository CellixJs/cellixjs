import { AdapterBackedPageObject, type ElementHandle } from '@cellix/serenity-framework/pages';

export class HomePage extends AdapterBackedPageObject {
	get signInButton(): ElementHandle {
		return this.adapter.getByRole('button', { name: /Log In|Sign In/i });
	}

	async clickSignIn(): Promise<void> {
		await this.signInButton.click();
	}
}
