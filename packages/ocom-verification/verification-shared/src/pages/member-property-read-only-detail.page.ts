import { AdapterBackedPageObject, type ElementHandle } from '@cellix/serenity-framework/pages';

/**
 * Page contract for a member's read-only view of another member's property.
 * This intentionally has no editable-form APIs: foreign properties must never
 * infer editability from an owner field rendered in the page.
 */
export class MemberPropertyReadOnlyDetailPage extends AdapterBackedPageObject {
	get heading(): ElementHandle {
		return this.adapter.getByText(/^Property Details$/);
	}

	get editableControls(): ElementHandle {
		return this.adapter.locator('input, textarea, [role="combobox"], [role="switch"]');
	}

	ownerIdentityNamed(memberName: string): ElementHandle {
		return this.adapter.getByText(memberName);
	}

	async hasEditableControls(): Promise<boolean> {
		if ((await this.adapter.locatorAll('input, textarea, [role="combobox"], [role="switch"]')).length > 0) {
			return true;
		}
		return await this.adapter
			.getByRole('button', { name: /^(?:Edit|Save|Remove|Delete)$/i })
			.isVisible()
			.catch(() => false);
	}

	async displaysOwnerIdentity(memberName: string): Promise<boolean> {
		return await this.ownerIdentityNamed(memberName).isVisible();
	}
}
