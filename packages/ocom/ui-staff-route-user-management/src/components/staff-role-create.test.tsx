import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { StaffRoleCreate } from './staff-role-create.tsx';

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
	observe(): void {
		// intentional no-op for jsdom
	}
	unobserve(): void {
		// intentional no-op for jsdom
	}
	disconnect(): void {
		// intentional no-op for jsdom
	}
}
window.ResizeObserver = window.ResizeObserver ?? (ResizeObserverStub as unknown as typeof ResizeObserver);

const findButtonByText = (rendered: HTMLElement, text: string): HTMLButtonElement | undefined => Array.from(rendered.querySelectorAll('button')).find((button) => (button.textContent ?? '').trim() === text);

const clickButton = (button: HTMLButtonElement): void => {
	act(() => {
		button.dispatchEvent(new MouseEvent('click', { bubbles: true }));
	});
};

describe('StaffRoleCreate', () => {
	let container!: HTMLDivElement;
	let root!: ReturnType<typeof createRoot>;

	const defaultProps = {
		onSubmit: vi.fn(),
		onCancel: vi.fn(),
		availableEnterpriseAppRoles: ['Staff.CaseManager', 'Staff.TechAdmin'],
	};

	const renderComponent = (props: Partial<Parameters<typeof StaffRoleCreate>[0]> = {}): HTMLDivElement => {
		container = document.createElement('div');
		document.body.appendChild(container);
		root = createRoot(container);
		act(() => {
			root.render(
				<StaffRoleCreate
					{...defaultProps}
					{...props}
				/>,
			);
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

	describe('titles', () => {
		it('renders the create title in create mode', () => {
			const rendered = renderComponent();
			expect(rendered.textContent).toContain('Create Staff Role');
		});

		it('renders the edit title in edit mode', () => {
			const rendered = renderComponent({ mode: 'edit' });
			expect(rendered.textContent).toContain('Edit Staff Role');
		});
	});

	describe('delete action visibility', () => {
		it('renders the delete action for a deletable role in edit mode', () => {
			const rendered = renderComponent({ mode: 'edit', showDelete: true, onDelete: vi.fn() });
			expect(findButtonByText(rendered, 'Delete Role')).toBeDefined();
		});

		it('does not render the delete action when showDelete is false', () => {
			const rendered = renderComponent({ mode: 'edit', showDelete: false, onDelete: vi.fn() });
			expect(findButtonByText(rendered, 'Delete Role')).toBeUndefined();
		});

		it('does not render the delete action in create mode even when showDelete is set', () => {
			const rendered = renderComponent({ mode: 'create', showDelete: true, onDelete: vi.fn() });
			expect(findButtonByText(rendered, 'Delete Role')).toBeUndefined();
		});

		it('renders the delete action as a danger button', () => {
			const rendered = renderComponent({ mode: 'edit', showDelete: true, onDelete: vi.fn() });
			const deleteButton = findButtonByText(rendered, 'Delete Role');
			expect(deleteButton?.className).toContain('ant-btn-dangerous');
		});
	});

	describe('delete confirmation', () => {
		it('shows a confirmation explaining reassignment to the matching default role', () => {
			const rendered = renderComponent({ mode: 'edit', showDelete: true, onDelete: vi.fn() });
			const deleteButton = findButtonByText(rendered, 'Delete Role');
			expect(deleteButton).toBeDefined();
			clickButton(deleteButton as HTMLButtonElement);

			const confirmation = document.querySelector('.ant-popconfirm');
			expect(confirmation).not.toBeNull();
			expect(confirmation?.textContent).toMatch(/reassigned/i);
			expect(confirmation?.textContent).toMatch(/default role/i);
		});

		it('calls onDelete when the confirmation is accepted', () => {
			const onDelete = vi.fn();
			const rendered = renderComponent({ mode: 'edit', showDelete: true, onDelete });
			clickButton(findButtonByText(rendered, 'Delete Role') as HTMLButtonElement);

			const confirmButton = Array.from(document.querySelectorAll<HTMLButtonElement>('.ant-popconfirm-buttons button')).find((button) => (button.textContent ?? '').trim() === 'Delete');
			expect(confirmButton).toBeDefined();
			clickButton(confirmButton as HTMLButtonElement);
			expect(onDelete).toHaveBeenCalledTimes(1);
		});

		it('does not call onDelete when the confirmation is cancelled', () => {
			const onDelete = vi.fn();
			const rendered = renderComponent({ mode: 'edit', showDelete: true, onDelete });
			clickButton(findButtonByText(rendered, 'Delete Role') as HTMLButtonElement);

			const cancelButton = Array.from(document.querySelectorAll<HTMLButtonElement>('.ant-popconfirm-buttons button')).find((button) => (button.textContent ?? '').trim() === 'Cancel');
			expect(cancelButton).toBeDefined();
			clickButton(cancelButton as HTMLButtonElement);
			expect(onDelete).not.toHaveBeenCalled();
		});
	});

	describe('deletion in progress', () => {
		it('shows the delete button in a loading state while deleting', () => {
			const rendered = renderComponent({ mode: 'edit', showDelete: true, onDelete: vi.fn(), deleting: true });
			const deleteButton = findButtonByText(rendered, 'Delete Role');
			expect(deleteButton?.className).toContain('ant-btn-loading');
		});
	});
});
