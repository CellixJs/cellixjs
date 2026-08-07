import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ThemeToggle } from './index.tsx';

describe('ThemeToggle', () => {
	it('renders unchecked by default', () => {
		render(<ThemeToggle />);
		const toggle = screen.getByRole('switch');
		expect(toggle).toBeDefined();
		expect(toggle.getAttribute('aria-checked')).toBe('false');
	});

	it('calls onChange when toggled', () => {
		const handleChange = vi.fn();
		render(<ThemeToggle onChange={handleChange} />);
		const toggle = screen.getByRole('switch');
		fireEvent.click(toggle);
		expect(handleChange).toHaveBeenCalledTimes(1);
		expect(handleChange.mock.calls[0]?.[0]).toBe(true);
	});
});
