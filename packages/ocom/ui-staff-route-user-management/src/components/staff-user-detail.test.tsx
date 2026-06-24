import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ActivityLogEntry } from './staff-user-detail.tsx';
import { StaffUserDetail } from './staff-user-detail.tsx';

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

const mockUser = {
	id: '1',
	displayName: 'Alice Admin',
	email: 'alice@example.com',
	role: { id: 'r1', roleName: 'Tech Admin' },
	createdAt: '2024-01-01T00:00:00Z',
};

const mockRoles = [
	{ id: 'r1', roleName: 'Tech Admin' },
	{ id: 'r2', roleName: 'Case Manager' },
];

const mockActivityLog: ActivityLogEntry[] = [
	{
		activityType: 'ROLE_ASSIGNED',
		activityDescription: 'Role "Tech Admin" was assigned',
		activityByStaffUserId: 'user-99',
		activityByStaffUserDisplayName: 'Jane Admin',
		createdAt: '2024-03-15T10:00:00Z',
	},
	{
		activityType: 'LOGIN',
		activityDescription: 'User logged in',
		activityByStaffUserId: 'user-1',
		activityByStaffUserDisplayName: 'John Doe',
		createdAt: '2024-03-20T08:30:00Z',
	},
];

describe('StaffUserDetail', () => {
	let container!: HTMLDivElement;
	let root!: ReturnType<typeof createRoot>;

	const defaultProps = {
		data: mockUser,
		availableRoles: mockRoles,
		canAssignRoles: true,
		selectedRoleId: 'r1',
		onRoleChange: vi.fn(),
		onSave: vi.fn(),
	};

	const renderComponent = (props = defaultProps): HTMLDivElement => {
		container = document.createElement('div');
		document.body.appendChild(container);
		root = createRoot(container);
		act(() => {
			root.render(<StaffUserDetail {...props} />);
		});
		return container;
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

	describe('user identity section', () => {
		it('renders user display name', () => {
			const rendered = renderComponent();
			expect(rendered.textContent).toContain('Alice Admin');
		});

		it('renders user email', () => {
			const rendered = renderComponent();
			expect(rendered.textContent).toContain('alice@example.com');
		});

		it('renders the page title', () => {
			const rendered = renderComponent();
			expect(rendered.textContent).toContain('Staff User Details');
		});
	});

	describe('activity log section', () => {
		it('renders the Activity Log heading', () => {
			const rendered = renderComponent({ ...defaultProps, activityLog: mockActivityLog });
			expect(rendered.textContent).toContain('Activity Log');
		});

		it('renders activity type column values', () => {
			const rendered = renderComponent({ ...defaultProps, activityLog: mockActivityLog });
			expect(rendered.textContent).toContain('ROLE_ASSIGNED');
			expect(rendered.textContent).toContain('LOGIN');
		});

		it('renders activity description column values', () => {
			const rendered = renderComponent({ ...defaultProps, activityLog: mockActivityLog });
			expect(rendered.textContent).toContain('Role "Tech Admin" was assigned');
			expect(rendered.textContent).toContain('User logged in');
		});

		it('renders performed-by display names', () => {
			const rendered = renderComponent({ ...defaultProps, activityLog: mockActivityLog });
			expect(rendered.textContent).toContain('Jane Admin');
			expect(rendered.textContent).toContain('John Doe');
		});

		it('shows empty text when there are no activity log entries', () => {
			const rendered = renderComponent({ ...defaultProps, activityLog: [] });
			expect(rendered.textContent).toContain('No activity recorded');
		});

		it('shows empty text when activityLog prop is omitted', () => {
			const rendered = renderComponent({ ...defaultProps });
			expect(rendered.textContent).toContain('No activity recorded');
		});

		it('renders all table column headers', () => {
			const rendered = renderComponent({ ...defaultProps, activityLog: mockActivityLog });
			expect(rendered.textContent).toContain('Activity Type');
			expect(rendered.textContent).toContain('Description');
			expect(rendered.textContent).toContain('Performed By');
			expect(rendered.textContent).toContain('Date');
		});
	});

	describe('role assignment section', () => {
		it('calls onSave when Save button is clicked', () => {
			const onSave = vi.fn();
			const rendered = renderComponent({ ...defaultProps, onSave, saveDisabled: false });
			const saveButton = Array.from(rendered.querySelectorAll('button')).find((b) =>
				b.textContent?.includes('Save'),
			);
			act(() => {
				saveButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
			});
			expect(onSave).toHaveBeenCalledOnce();
		});

		it('disables Save button when saveDisabled is true', () => {
			const rendered = renderComponent({ ...defaultProps, saveDisabled: true });
			const saveButton = Array.from(rendered.querySelectorAll('button')).find((b) =>
				b.textContent?.includes('Save'),
			);
			expect(saveButton).toBeDefined();
			expect(saveButton?.disabled).toBe(true);
		});

		it('disables Save button when canAssignRoles is false', () => {
			const rendered = renderComponent({ ...defaultProps, canAssignRoles: false });
			const saveButton = Array.from(rendered.querySelectorAll('button')).find((b) =>
				b.textContent?.includes('Save'),
			);
			expect(saveButton?.disabled).toBe(true);
		});

		it('renders role name as the selected option label (not raw ID)', () => {
			const rendered = renderComponent({
				...defaultProps,
				selectedRoleId: 'r1',
				availableRoles: [{ id: 'r1', roleName: 'Tech Admin' }],
			});
			// The Select value is the ID; the rendered option label must show the role name.
			// antd renders the selected label in the combobox title attribute.
			const _combobox = rendered.querySelector('[role="combobox"]');
			// The title on the selection item or the input's value should reflect the label, not the raw ID
			const selectionItem = rendered.querySelector('.ant-select-selection-item');
			const displayText = selectionItem?.getAttribute('title') ?? selectionItem?.textContent ?? '';
			expect(displayText).toBe('Tech Admin');
		});
	});
});
