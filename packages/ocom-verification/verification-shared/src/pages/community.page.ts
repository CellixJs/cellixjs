import type { ElementHandle, PageAdapter } from './page-adapter.ts';

/**
 * Community page object — works with both jsdom (acceptance UI tests)
 * and Playwright (e2e tests) via the PageAdapter abstraction.
 */
export class CommunityPage {
	constructor(private readonly adapter: PageAdapter) {}

	// --- Create Community form ---
	get nameInput(): ElementHandle {
		return this.adapter.getByPlaceholder('Name');
	}

	get createCommunityButton(): ElementHandle {
		return this.adapter.getByRole('button', { name: /Create.*Community/i });
	}

	get submitButton(): ElementHandle {
		return this.adapter.getByRole('button', { name: /Create/i });
	}

	get cancelButton(): ElementHandle {
		return this.adapter.getByRole('button', { name: /Cancel/i });
	}

	get firstValidationError(): ElementHandle {
		return this.adapter.locator('.ant-form-item-explain-error');
	}

	get errorToast(): ElementHandle {
		return this.adapter.locator('.ant-message-error, [role="alert"]');
	}

	// --- Loading indicator ---
	get loadingButton(): ElementHandle {
		return this.adapter.locator('.ant-btn-loading');
	}

	// --- Success modal ---
	get modal(): ElementHandle {
		return this.adapter.locator('.ant-modal');
	}

	get viewCommunityButton(): ElementHandle {
		return this.adapter.getByRole('button', { name: /View Community/i });
	}

	// --- Community list table ---
	communityNameCell(name: string): ElementHandle {
		return this.adapter.getByText(name, { selector: 'table' });
	}

	async statusTagInRow(name: string): Promise<ElementHandle | null> {
		const row = await this.communityRowByName(name);
		return row ? row.querySelector('.ant-tag') : null;
	}

	// --- Helper methods ---
	async fillName(value: string): Promise<void> {
		await this.nameInput.fill(value);
	}

	async fillForm(data: { name?: string }): Promise<void> {
		if (data.name) await this.fillName(data.name);
	}

	async clickCreate(): Promise<void> {
		await this.submitButton.click();
	}

	private async communityRowByName(name: string): Promise<ElementHandle | null> {
		const table = this.adapter.getByRole('table');
		const rows = await table.querySelectorAll('tr');

		for (const row of rows) {
			const text = await row.textContent();
			if (text?.includes(name)) {
				return row;
			}
		}

		return null;
	}
}
