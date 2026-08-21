import { describe, expect, it } from 'vitest';
import { StaffUserDetailPage } from './staff-user-detail.page.ts';
import { StaffUsersListPage } from './staff-users-list.page.ts';

class FakeElementHandle {
	constructor(
		private readonly text: string | null = null,
		private readonly children: FakeElementHandle[] = [],
		private readonly clickImpl: (() => void) | null = null,
		private readonly disabled = false,
	) {}

	fill(): Promise<void> {
		return Promise.resolve();
	}
	click(): Promise<void> {
		this.clickImpl?.();
		return Promise.resolve();
	}
	check(): Promise<void> {
		return Promise.resolve();
	}
	textContent(): Promise<string | null> {
		return Promise.resolve(this.text);
	}
	getAttribute(name: string): Promise<string | null> {
		if (name === 'disabled') {
			return Promise.resolve(this.disabled ? 'true' : null);
		}
		if (name === 'aria-disabled') {
			return Promise.resolve(this.disabled ? 'true' : null);
		}
		return Promise.resolve(null);
	}
	inputValue(): Promise<string | null> {
		return Promise.resolve(null);
	}
	isChecked(): Promise<boolean> {
		return Promise.resolve(false);
	}
	isVisible(): Promise<boolean> {
		return Promise.resolve(true);
	}
	isDisabled(): Promise<boolean> {
		return Promise.resolve(this.disabled);
	}
	waitFor(): Promise<void> {
		return Promise.resolve();
	}
	querySelector(): Promise<FakeElementHandle | null> {
		return Promise.resolve(null);
	}
	querySelectorAll(): Promise<FakeElementHandle[]> {
		return Promise.resolve(this.children);
	}
}

function createAdapter() {
	const rows = [
		new FakeElementHandle('Alice Smith alice@example.com Finance', [new FakeElementHandle('Alice Smith')]),
		new FakeElementHandle('Bob Jones bob@example.com Finance', [new FakeElementHandle('Bob Jones')]),
	];
	const cells = rows.map((row) => new FakeElementHandle('Alice Smith', [])).map((cell, index) => (index === 0 ? new FakeElementHandle('Alice Smith') : new FakeElementHandle('Bob Jones')));
	return {
		getByText: (pattern?: RegExp | string) => new FakeElementHandle(typeof pattern === 'string' ? pattern : 'Staff Users (2)'),
		getByRole: (role: string) => new FakeElementHandle(role === 'button' ? 'Save' : ''),
		locator: (selector: string) => {
			if (selector === '.ant-table') {
				return new FakeElementHandle('role assigned: service line owner');
			}
			if (selector === '.ant-select') {
				return new FakeElementHandle('finance', [], null, false);
			}
			if (selector === '.ant-select-selection-item') {
				return new FakeElementHandle('finance');
			}
			return new FakeElementHandle('');
		},
		locatorAll: (selector: string) => {
			if (selector.includes('ant-table-tbody')) {
				return Promise.resolve(selector.includes('tr.ant-table-row td:first-child') ? cells : rows);
			}
			return Promise.resolve([]);
		},
		url: () => 'http://localhost',
		goto: async () => undefined,
		waitForURL: async () => undefined,
		waitForTimeout: async () => undefined,
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

	it('reports when the role assignment controls are disabled', async () => {
		const page = new StaffUserDetailPage({
			...createAdapter(),
			locator: (selector: string) => {
				if (selector === '.ant-select') {
					return new FakeElementHandle('', [], null, true);
				}
				if (selector === '.ant-select-selection-item') {
					return new FakeElementHandle('finance', [], null, false);
				}
				return new FakeElementHandle('', [], null, false);
			},
			getByRole: (role: string) => new FakeElementHandle(role === 'button' ? 'Save' : '', [], null, role === 'button'),
		} as never);

		await expect(page.roleSelectDisabled()).resolves.toBe(true);
		await expect(page.saveButtonDisabled()).resolves.toBe(true);
	});
});
