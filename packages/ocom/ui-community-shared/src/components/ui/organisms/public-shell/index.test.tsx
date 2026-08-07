import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PublicShell } from './index.tsx';

describe('PublicShell', () => {
	it('renders header, content, and footer', () => {
		render(
			<PublicShell mode="light" onThemeChange={() => undefined}>
				<div data-testid="page-content">Hello</div>
			</PublicShell>,
		);
		expect(screen.getByRole('banner')).toBeDefined();
		expect(screen.getByTestId('page-content')).toBeDefined();
		expect(screen.getByText(/©2020 Owner Community All Rights Reserved/i)).toBeDefined();
	});
});
