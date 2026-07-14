import { AdapterBackedPageObject, type ElementHandle } from '@cellix/serenity-framework/pages';

export class MemberListPage extends AdapterBackedPageObject {
	memberName(name: string): ElementHandle {
		return this.adapter.getByText(name);
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
