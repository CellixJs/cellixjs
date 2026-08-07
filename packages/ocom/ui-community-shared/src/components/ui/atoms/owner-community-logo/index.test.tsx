import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { OwnerCommunityLogo } from './index.tsx';

describe('OwnerCommunityLogo', () => {
	it('renders with light mode colors', () => {
		render(<OwnerCommunityLogo mode="light" />);
		const logo = screen.getByRole('img', { name: /owner community/i });
		expect(logo).toBeDefined();
		expect(logo.getAttribute('data-owner-community-logo-mode')).toBe('light');
	});

	it('renders with dark mode colors', () => {
		render(<OwnerCommunityLogo mode="dark" />);
		const logo = screen.getByRole('img', { name: /owner community/i });
		expect(logo).toBeDefined();
		expect(logo.getAttribute('data-owner-community-logo-mode')).toBe('dark');
	});
});
