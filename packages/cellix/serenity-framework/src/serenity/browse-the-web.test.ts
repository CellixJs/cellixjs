import type { BrowserContext, Page } from 'playwright';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { BrowseTheWeb } from './browser.ts';

function browserHandles() {
	const page = {
		close: vi.fn(),
		isClosed: vi.fn(() => false),
	} as unknown as Page;
	const context = {
		close: vi.fn(),
	} as unknown as BrowserContext;

	return { context, page };
}

describe('BrowseTheWeb', () => {
	afterEach(async () => {
		await BrowseTheWeb.current()?.close();
	});

	it('clears the fallback browser ability when the active ability closes', async () => {
		const { context, page } = browserHandles();
		const ability = BrowseTheWeb.using(page, context);

		expect(BrowseTheWeb.current()).toBe(ability);

		await ability.close();

		expect(BrowseTheWeb.current()).toBeUndefined();
	});

	it('keeps the replacement fallback active when an older ability closes', async () => {
		const first = browserHandles();
		const second = browserHandles();
		const older = BrowseTheWeb.using(first.page, first.context);
		const current = BrowseTheWeb.using(second.page, second.context);

		await older.close();

		expect(BrowseTheWeb.current()).toBe(current);
	});
});
