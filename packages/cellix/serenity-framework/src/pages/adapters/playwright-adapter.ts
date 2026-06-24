import type { Locator as PlaywrightLocator, Page as PlaywrightPage } from 'playwright';
import type { ElementHandle, ElementWaitOptions, PageAdapter, PageNavigationOptions, PageUrlMatcher } from '../page-adapter.ts';

/**
 * Element handle backed by a Playwright `Locator`.
 */
export class PlaywrightElementHandle implements ElementHandle {
	/**
	 * @param locator Playwright locator to adapt to the framework element contract.
	 */
	constructor(private readonly locator: PlaywrightLocator) {}

	async fill(value: string): Promise<void> {
		await this.locator.fill(value);
	}

	async click(): Promise<void> {
		await this.locator.click();
	}

	async check(): Promise<void> {
		await this.locator.check();
	}

	textContent(): Promise<string | null> {
		return this.locator.textContent();
	}

	getAttribute(name: string): Promise<string | null> {
		return this.locator.getAttribute(name);
	}

	isVisible(): Promise<boolean> {
		return this.locator.isVisible();
	}

	async waitFor(options?: ElementWaitOptions): Promise<void> {
		await this.locator.waitFor(options);
	}

	async querySelector(selector: string): Promise<ElementHandle | null> {
		const child = this.locator.locator(selector).first();
		const count = await child.count();
		return count > 0 ? new PlaywrightElementHandle(child) : null;
	}

	async querySelectorAll(selector: string): Promise<ElementHandle[]> {
		const all = this.locator.locator(selector);
		const count = await all.count();
		const handles: ElementHandle[] = [];
		for (let i = 0; i < count; i++) {
			handles.push(new PlaywrightElementHandle(all.nth(i)));
		}
		return handles;
	}
}

/**
 * Page adapter backed by a Playwright `Page`.
 *
 * Use this adapter at the edge of an E2E test package, then pass it into
 * app-specific page objects that depend only on {@link PageAdapter}.
 */
export class PlaywrightPageAdapter implements PageAdapter {
	/**
	 * @param page Playwright page used to resolve locators and navigation.
	 */
	constructor(private readonly page: PlaywrightPage) {}

	getByPlaceholder(text: string): ElementHandle {
		return new PlaywrightElementHandle(this.page.getByPlaceholder(text));
	}

	getByLabel(text: string): ElementHandle {
		return new PlaywrightElementHandle(this.page.getByLabel(text));
	}

	getByRole(role: string, options?: { name?: string | RegExp }): ElementHandle {
		const roleOptions = options?.name ? { name: options.name } : undefined;
		return new PlaywrightElementHandle(this.page.getByRole(role as Parameters<PlaywrightPage['getByRole']>[0], roleOptions));
	}

	locator(selector: string): ElementHandle {
		return new PlaywrightElementHandle(this.page.locator(selector));
	}

	async locatorAll(selector: string): Promise<ElementHandle[]> {
		const all = this.page.locator(selector);
		const count = await all.count();
		const handles: ElementHandle[] = [];
		for (let i = 0; i < count; i++) {
			handles.push(new PlaywrightElementHandle(all.nth(i)));
		}
		return handles;
	}

	getByText(text: string | RegExp, options?: { selector?: string }): ElementHandle {
		const root = options?.selector ? this.page.locator(options.selector) : this.page;
		return new PlaywrightElementHandle(root.getByText(text).first());
	}

	async goto(url: string, options?: PageNavigationOptions): Promise<void> {
		await this.page.goto(url, options);
	}

	async waitForURL(url: PageUrlMatcher, options?: PageNavigationOptions): Promise<void> {
		await this.page.waitForURL(url as Parameters<PlaywrightPage['waitForURL']>[0], options);
	}

	url(): string {
		return this.page.url();
	}

	waitForTimeout(timeout: number): Promise<void> {
		return this.page.waitForTimeout(timeout);
	}
}
