import type { PageAdapter } from './page-adapter.ts';

/**
 * Shared login page object backed by the universal page adapter.
 */
export class LoginPage {
	constructor(private readonly page: PageAdapter) {}

	get emailInput() {
		return this.page.getByLabel('Email');
	}

	get passwordInput() {
		return this.page.getByLabel('Password');
	}

	get loginButton() {
		return this.page.locator('form button[type="submit"]');
	}

	async goto(): Promise<void> {
		await this.page.goto('/login', { waitUntil: 'networkidle' });
	}

	async login(email: string, password: string): Promise<void> {
		await this.emailInput.fill(email);
		await this.passwordInput.fill(password);
		await this.loginButton.click();
	}

	async waitForRedirectComplete(): Promise<void> {
		await this.page.waitForURL((url) => !url.pathname.includes('auth-redirect') && !url.pathname.includes('/login') && !url.hostname.includes('mock-auth'), { timeout: 30_000 });
	}
}
