import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { StaffRolesList } from './staff-roles-list.tsx';

Object.defineProperty(window, 'matchMedia', {
	writable: true,
	value: vi.fn().mockImplementation((query: string) => ({
		matches: false,
		media: query,
		onchange: null,
		addListener: vi.fn(),
		removeListener: vi.fn(),
		addEventListener: vi.fn(),
		removeEventListener: vi.fn(),
		dispatchEvent: vi.fn(),
	})),
});

class ResizeObserverStub {
	observe = vi.fn();
	unobserve = vi.fn();
	disconnect = vi.fn();
}
window.ResizeObserver = window.ResizeObserver ?? (ResizeObserverStub as unknown as typeof ResizeObserver);

describe('StaffRolesList', () => {
	let container!: HTMLDivElement;
	let root!: ReturnType<typeof createRoot>;
	const onEdit = vi.fn();

	const renderComponent = (permissions: { canEdit?: boolean; canViewDetails?: boolean }): void => {
		container = document.createElement('div');
		document.body.appendChild(container);
		root = createRoot(container);
		act(() => {
			root.render(
				<StaffRolesList
					data={[
						{
							id: 'role-1',
							roleName: 'Test Role',
							enterpriseAppRole: 'Staff.CaseManager',
							createdAt: '2026-01-01T00:00:00.000Z',
							updatedAt: '2026-01-01T00:00:00.000Z',
						},
					]}
					onEdit={onEdit}
					onCreate={vi.fn()}
					{...permissions}
				/>,
			);
		});
	};

	beforeEach(() => {
		vi.clearAllMocks();
	});

	afterEach(() => {
		act(() => {
			root?.unmount();
		});
		container?.remove();
	});

	it('shows a View action for users who can remove but not edit roles', () => {
		renderComponent({ canEdit: false, canViewDetails: true });

		const viewButton = Array.from(container.querySelectorAll('button')).find((button) => button.textContent?.trim() === 'View');
		expect(viewButton).toBeDefined();
		act(() => {
			viewButton?.click();
		});
		expect(onEdit).toHaveBeenCalledWith('role-1');
	});

	it('hides role details actions when the user can neither edit nor remove roles', () => {
		renderComponent({ canEdit: false, canViewDetails: false });

		expect(container.textContent).not.toContain('Edit');
		expect(container.textContent).not.toContain('View');
	});
});
