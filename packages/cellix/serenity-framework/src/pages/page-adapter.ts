/**
 * Cross-runtime handle for a single element selected by a {@link PageAdapter}.
 *
 * Implementations may wrap a Playwright locator, a jsdom element, or another
 * browser automation primitive. Page objects should use this interface instead
 * of depending on a concrete runtime.
 */
export interface ElementHandle {
	/** Fill an editable control with the supplied value. */
	fill(value: string): Promise<void>;

	/** Click the element. */
	click(): Promise<void>;

	/** Check a checkbox-like control. */
	check(): Promise<void>;

	/** Read the element text content, or `null` when no element is available. */
	textContent(): Promise<string | null>;

	/** Read an element attribute, or `null` when the attribute is missing. */
	getAttribute(name: string): Promise<string | null>;

	/** Return whether the element is currently visible to the adapter runtime. */
	isVisible(): Promise<boolean>;

	/** Wait for the element to enter a runtime-supported state. */
	waitFor(options?: ElementWaitOptions): Promise<void>;

	/** Find the first child matching a CSS selector. */
	querySelector(selector: string): Promise<ElementHandle | null>;

	/** Find all children matching a CSS selector. */
	querySelectorAll(selector: string): Promise<ElementHandle[]>;
}

/** Wait states supported by cross-runtime element handles. */
export type ElementWaitState = 'visible' | 'hidden' | 'attached' | 'detached';

/** Options used when waiting for an element state. */
export interface ElementWaitOptions {
	/** Runtime-specific element state to wait for. */
	state?: ElementWaitState;

	/** Maximum wait time in milliseconds. */
	timeout?: number;
}

/** Navigation lifecycle values shared with Playwright-compatible adapters. */
export type PageNavigationWaitUntil = 'load' | 'domcontentloaded' | 'networkidle' | 'commit';

/** URL matcher accepted by cross-runtime page adapters. */
export type PageUrlMatcher = string | RegExp | ((url: URL) => boolean);

/** Options used when navigating or waiting for a URL. */
export interface PageNavigationOptions {
	/** Maximum wait time in milliseconds. */
	timeout?: number;

	/** Navigation lifecycle state to wait for. */
	waitUntil?: PageNavigationWaitUntil;
}

/**
 * Runtime-neutral page API for app-specific page objects.
 *
 * Page objects consume this interface so the same page-object class can run in
 * fast jsdom acceptance tests and full Playwright E2E tests.
 */
export interface PageAdapter {
	/** Select an element by placeholder text. */
	getByPlaceholder(text: string): ElementHandle;

	/** Select a form control by visible or ARIA label text. */
	getByLabel(text: string): ElementHandle;

	/** Select an element by accessible role and optional accessible name. */
	getByRole(role: string, options?: { name?: string | RegExp }): ElementHandle;

	/** Select the first element matching a CSS selector. */
	locator(selector: string): ElementHandle;

	/** Select all elements matching a CSS selector. */
	locatorAll(selector: string): Promise<ElementHandle[]>;

	/** Select the first element containing text, optionally scoped by selector. */
	getByText(text: string | RegExp, options?: { selector?: string }): ElementHandle;

	/** Navigate the current page-like runtime to a URL. */
	goto(url: string, options?: PageNavigationOptions): Promise<void>;

	/** Wait for the current URL to match a string, regex, or predicate. */
	waitForURL(url: PageUrlMatcher, options?: PageNavigationOptions): Promise<void>;

	/** Read the current page URL. */
	url(): string;

	/** Wait for a fixed duration. Prefer runtime events when possible. */
	waitForTimeout(timeout: number): Promise<void>;
}

/** Supported adapter runtime labels. */
export type PageAdapterMode = 'jsdom' | 'playwright';
