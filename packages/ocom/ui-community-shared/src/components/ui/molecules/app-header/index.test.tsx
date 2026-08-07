import { fireEvent, render, screen } from '@testing-library/react';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { AppHeader } from './index.tsx';

beforeAll(() => {
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
});

describe('AppHeader', () => {
	it('renders logged-out actions', () => {
		render(<AppHeader mode="light" onThemeChange={() => undefined} />);
		expect(screen.getByText(/Log In/i)).toBeDefined();
		expect(screen.getByText(/Sign Up/i)).toBeDefined();
		expect(screen.getByRole('img', { name: /owner community/i })).toBeDefined();
	});

	it('renders logged-in actions', () => {
		render(<AppHeader mode="light" onThemeChange={() => undefined} user={{ firstName: 'Olivia', lastName: 'K' }} />);
		expect(screen.getByText(/Olivia K./i)).toBeDefined();
		expect(screen.getByText(/Log Out/i)).toBeDefined();
	});

	it('calls onThemeChange when toggle is clicked', () => {
		const handleThemeChange = vi.fn();
		render(<AppHeader mode="light" onThemeChange={handleThemeChange} />);
		const toggle = screen.getByRole('switch');
		fireEvent.click(toggle);
		expect(handleThemeChange).toHaveBeenCalledTimes(1);
		expect(handleThemeChange.mock.calls[0]?.[0]).toBe(true);
	});
});
