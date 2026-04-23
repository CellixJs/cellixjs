import type { ElementHandle, PageAdapter, PageNavigationWaitUntil, PageUrlMatcher } from '../page-adapter.ts';

type PlaywrightPage = import('@playwright/test').Page;
type PlaywrightLocator = import('@playwright/test').Locator;

class PlaywrightElementHandle implements ElementHandle {
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

	async waitFor(options?: { state?: 'visible' | 'hidden' | 'attached' | 'detached'; timeout?: number }): Promise<void> {
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

export class PlaywrightPageAdapter implements PageAdapter {
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

	async goto(url: string, options?: { timeout?: number; waitUntil?: PageNavigationWaitUntil }): Promise<void> {
		await this.page.goto(url, options);
	}

	async waitForURL(url: PageUrlMatcher, options?: { timeout?: number; waitUntil?: PageNavigationWaitUntil }): Promise<void> {
		await this.page.waitForURL(url as Parameters<PlaywrightPage['waitForURL']>[0], options);
	}

	url(): string {
		return this.page.url();
	}

	waitForTimeout(timeout: number): Promise<void> {
		return this.page.waitForTimeout(timeout);
	}
}
