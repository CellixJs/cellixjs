import { AdapterBackedPageObject, type ElementHandle } from '@cellix/serenity-framework/pages';

/**
 * Maps staff role permission command keys (as used in shared scenarios and the
 * GraphQL inputs) to the checkbox labels rendered by the create/edit form.
 */
export const STAFF_ROLE_PERMISSION_LABELS: Record<string, string> = {
	canManageCommunities: 'Can Manage Communities',
	canManageStaffRolesAndPermissions: 'Can Manage Staff Roles and Permissions',
	canManageAllCommunities: 'Can Manage All Communities',
	canDeleteCommunities: 'Can Delete Communities',
	canChangeCommunityOwner: 'Can Change Community Owner',
	canReIndexSearchCollections: 'Can Reindex Search Collections',
	canManageUsers: 'Can Manage Users',
	canAssignStaffRoles: 'Can Assign Staff Roles',
	canViewStaffUsers: 'Can View Staff Users',
	canViewRoles: 'Can View Staff Roles',
	canAddRole: 'Can Add Staff Role',
	canEditRole: 'Can Edit Staff Role',
	canRemoveRole: 'Can Remove Staff Role',
	canManageFinance: 'Can Manage Finance',
	canViewGLBatchSummaries: 'Can View GL Batch Summaries',
	canViewFinanceConfigs: 'Can View Finance Configs',
	canCreateFinanceConfigs: 'Can Create Finance Configs',
	canManageTechAdmin: 'Can Manage Tech Admin',
	canViewDatabaseDocuments: 'Can View Database Documents',
	canViewBlobExplorer: 'Can View Blob Explorer',
	canViewQueueDashboard: 'Can View Queue Dashboard',
	canSendQueueMessages: 'Can Send Queue Messages',
};

/**
 * Page object for the staff role create/edit form.
 *
 * Works against both the DOM adapter (component acceptance tests) and the
 * Playwright adapter (browser E2E tests).
 */
export class StaffRoleFormPage extends AdapterBackedPageObject {
	get roleNameInput(): ElementHandle {
		return this.adapter.getByLabel('Role Name');
	}

	get enterpriseAppRoleSelect(): ElementHandle {
		return this.adapter.getByRole('combobox');
	}

	get submitButton(): ElementHandle {
		return this.adapter.getByRole('button', { name: /Create Role|Update Role/i });
	}

	get firstValidationError(): ElementHandle {
		return this.adapter.locator('.ant-form-item-explain-error');
	}

	get errorFeedback(): ElementHandle {
		return this.adapter.locator('.ant-message-error, [role="alert"]');
	}

	get successFeedback(): ElementHandle {
		return this.adapter.locator('.ant-message-success');
	}

	async fillRoleName(value: string): Promise<void> {
		await this.roleNameInput.fill(value);
	}

	/** Current value of the role name input. */
	async roleNameValue(): Promise<string> {
		return (await this.roleNameInput.inputValue()) ?? '';
	}

	/** Currently selected enterprise app role (antd Select selection). */
	async selectedEnterpriseAppRole(): Promise<string> {
		const selection = this.adapter.locator('.ant-select-selection-item, .ant-select-content');
		return (await selection.getAttribute('title')) ?? (await selection.textContent())?.trim() ?? '';
	}

	/** Open the enterprise app role dropdown and pick the option with the given value. */
	async selectEnterpriseAppRole(value: string): Promise<void> {
		await this.enterpriseAppRoleSelect.click();
		const option = this.adapter.locator(`.ant-select-item-option[title="${value}"]`);
		await option.waitFor({ state: 'visible' });
		await option.click();
	}

	/** Check a permission checkbox by its command key (e.g. `canViewRoles`). */
	async grantPermission(permissionKey: string): Promise<void> {
		await this.permissionCheckbox(permissionKey).check();
	}

	/** Return whether a permission checkbox is currently checked. */
	async isPermissionGranted(permissionKey: string): Promise<boolean> {
		return await this.permissionCheckbox(permissionKey).isChecked();
	}

	private permissionCheckbox(permissionKey: string): ElementHandle {
		const label = STAFF_ROLE_PERMISSION_LABELS[permissionKey];
		if (!label) {
			throw new Error(`Unknown staff role permission "${permissionKey}"`);
		}
		return this.adapter.getByLabel(label);
	}

	async clickSubmit(): Promise<void> {
		await this.submitButton.click();
	}
}
