import { describe, expect, it } from 'vitest';
import { StaffUserDetailPage } from './staff-user-detail.page.ts';
import { StaffUsersListPage } from './staff-users-list.page.ts';

class FakeElementHandle {
	constructor(
		private readonly text: string | null = null,
		private readonly children: FakeElementHandle[] = [],
		private readonly clickImpl: (() => void) | null = null,
	) {}

	async fill(): Promise<void> {}
	async click(): Promise<void> {
		this.clickImpl?.();
	}
	async check(): Promise<void> {}
	async textContent(): Promise<string | null> {
		return this.text;
	}
	async getAttribute(): Promise<string | null> {
		return null;
	}
	async inputValue(): Promise<string | null> {
		return null;
	}
	async isChecked(): Promise<boolean> {
		return false;
	}
	async isVisible(): Promise<boolean> {
		return true;
	}
	async waitFor(): Promise<void> {}
	async querySelector(): Promise<FakeElementHandle | null> {
		return null;
	}
	async querySelectorAll(): Promise<FakeElementHandle[]> {
		return this.children;
	}
}

function createAdapter() {
	const rows = [
		new FakeElementHandle('Alice Smith alice@example.com Finance', [new FakeElementHandle('Alice Smith')]),
		new FakeElementHandle('Bob Jones bob@example.com Finance', [new FakeElementHandle('Bob Jones')]),
	];
	const cells = rows.map((row) => row.querySelectorAll()[0]);
	return {
		getByText: () => new FakeElementHandle('Staff Users (2)'),
		getByRole: () => new FakeElementHandle('Save'),
		locator: () => new FakeElementHandle(''),
		locatorAll: async (selector: string) => {
			if (selector.includes('ant-table-tbody')) {
				return selector.includes('tr.ant-table-row td:first-child') ? cells : rows;
			}
			return [];
		},
		url: () => 'http://localhost',
		goto: async () => {},
		waitForURL: async () => {},
		waitForTimeout: async () => {},
		getByPlaceholder: () => new FakeElementHandle(''),
		getByLabel: () => new FakeElementHandle(''),
	};
}

describe('staff user page objects', () => {
	it('lists the rendered staff users from the table rows', async () => {
		const page = new StaffUsersListPage(createAdapter() as never);

		await expect(page.listedUserNames()).resolves.toEqual(['Alice Smith', 'Bob Jones']);
	});

	it('can resolve a detail view entry from the activity log table', async () => {
		const page = new StaffUserDetailPage(createAdapter() as never);

		await expect(page.hasActivityLogEntry('role assigned')).resolves.toBe(true);
	});
});
