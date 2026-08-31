import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MaintenanceKickoutMessage } from './maintenance-kickout-message.tsx';

describe('MaintenanceKickoutMessage', () => {
	let container: HTMLDivElement;
	let root: ReturnType<typeof createRoot>;

	beforeEach(() => {
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
		container = document.createElement('div');
		document.body.appendChild(container);
		root = createRoot(container);
	});

	afterEach(() => {
		act(() => {
			root.unmount();
		});
		container.remove();
	});

	it('shows the maintenance countdown warning', () => {
		act(() => {
			root.render(<MaintenanceKickoutMessage timer="1:30" />);
		});

		expect(container.getAttribute('role')).toBeNull();
		expect(container.querySelector('[role="alert"]')?.textContent).toContain('Maintenance will begin in 1:30. Please save your work and log out.');
	});
});
