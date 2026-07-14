import { AdapterBackedPageObject, type ElementHandle } from '@cellix/serenity-framework/pages';

export class MemberListPage extends AdapterBackedPageObject {
	get searchInput(): ElementHandle {
		return this.adapter.getByPlaceholder('Search by member name or email');
	}

	memberName(name: string): ElementHandle {
		return this.adapter.getByText(name);
	}

	async searchByMemberName(name: string): Promise<void> {
		await this.searchInput.fill(name);
	}

	async clickRemoveMember(name: string): Promise<void> {
		const row = this.adapter.getByRole('row', { name: new RegExp(name) });
		const buttons = await row.querySelectorAll('button');
		for (const button of buttons) {
			if ((await button.textContent())?.trim() === 'Remove') {
				await button.click();
				return;
			}
		}
		const removeButton = this.adapter.getByRole('button', { name: /^Remove$/i });
		if (await removeButton.isVisible()) {
			await removeButton.click();
			return;
		}
		throw new Error(`Remove action not found for member "${name}"`);
	}
}
