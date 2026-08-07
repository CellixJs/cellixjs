import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AppFooter } from './index.tsx';

describe('AppFooter', () => {
	it('renders default copyright text', () => {
		render(<AppFooter />);
		expect(screen.getByText(/©2020 Owner Community All Rights Reserved/i)).toBeDefined();
	});

	it('renders custom copyright text', () => {
		render(<AppFooter copyrightText="©2024 Owner Community" />);
		expect(screen.getByText(/©2024 Owner Community/i)).toBeDefined();
	});

	it('applies centered layout class', () => {
		render(<AppFooter />);
		const footer = document.querySelector('footer');
		expect(footer?.classList.contains('text-center')).toBe(true);
	});
});
