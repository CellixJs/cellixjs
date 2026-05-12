/**
 * Universal element handle — wraps a single DOM element or Playwright locator.
 * Provides a common interface for both jsdom (acceptance-test UI) and Playwright (e2e) contexts.
 */
export interface ElementHandle {
	fill(value: string): Promise<void>;
	click(): Promise<void>;
	check(): Promise<void>;
	textContent(): Promise<string | null>;
	getAttribute(name: string): Promise<string | null>;
	isVisible(): Promise<boolean>;
	waitFor(options?: { state?: 'visible' | 'hidden' | 'attached' | 'detached'; timeout?: number }): Promise<void>;
	querySelector(selector: string): Promise<ElementHandle | null>;
	querySelectorAll(selector: string): Promise<ElementHandle[]>;
}

export type PageNavigationWaitUntil = 'load' | 'domcontentloaded' | 'networkidle' | 'commit';

export type PageUrlMatcher = string | RegExp | ((url: URL) => boolean);

/**
 * Universal page adapter — abstracts element lookup across jsdom and Playwright.
 * Page objects depend on this interface rather than a specific test runner.
 */
export interface PageAdapter {
	getByPlaceholder(text: string): ElementHandle;
	getByLabel(text: string): ElementHandle;
	getByRole(role: string, options?: { name?: string | RegExp }): ElementHandle;
	locator(selector: string): ElementHandle;
	locatorAll(selector: string): Promise<ElementHandle[]>;
	getByText(text: string | RegExp, options?: { selector?: string }): ElementHandle;
	goto(url: string, options?: { timeout?: number; waitUntil?: PageNavigationWaitUntil }): Promise<void>;
	waitForURL(url: PageUrlMatcher, options?: { timeout?: number; waitUntil?: PageNavigationWaitUntil }): Promise<void>;
	url(): string;
	waitForTimeout(timeout: number): Promise<void>;
}

export type PageAdapterMode = 'jsdom' | 'playwright';
