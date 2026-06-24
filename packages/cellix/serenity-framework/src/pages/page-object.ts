import type { PageAdapter } from './page-adapter.ts';

/**
 * Contract for page objects backed by a {@link PageAdapter}.
 *
 * The interface intentionally requires only the adapter relationship. Consumer
 * packages define domain-specific methods and locators on their own page object
 * classes while preserving the common adapter-based pattern.
 */
export interface PageObject<TAdapter extends PageAdapter = PageAdapter> {
	/** Runtime-neutral adapter used by the page object. */
	readonly adapter: TAdapter;
}

/**
 * Base class for adapter-backed page objects.
 *
 * Extend this class when a page object should work against multiple runtimes,
 * such as jsdom for acceptance UI tests and Playwright for browser E2E tests.
 *
 * @example
 * ```ts
 * class LoginPage extends AdapterBackedPageObject {
 *   async submit(email: string): Promise<void> {
 *     await this.adapter.getByLabel('Email').fill(email);
 *     await this.adapter.getByRole('button', { name: /Sign in/i }).click();
 *   }
 * }
 * ```
 */
export abstract class AdapterBackedPageObject<TAdapter extends PageAdapter = PageAdapter> implements PageObject<TAdapter> {
	/**
	 * Create a page object backed by a runtime-specific adapter.
	 *
	 * @param adapter Adapter that performs DOM or browser operations.
	 */
	constructor(public readonly adapter: TAdapter) {}
}
