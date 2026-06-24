import { describe, expect, it } from 'vitest';
import { AdapterBackedPageObject, type PageAdapter } from './index.ts';

class TestPage extends AdapterBackedPageObject {
	get currentUrl(): string {
		return this.adapter.url();
	}
}

describe('AdapterBackedPageObject', () => {
	it('keeps page objects bound to their runtime adapter', () => {
		const adapter = {
			url: () => 'https://example.test',
		} as PageAdapter;

		const page = new TestPage(adapter);

		expect(page.adapter).toBe(adapter);
		expect(page.currentUrl).toBe('https://example.test');
	});
});
