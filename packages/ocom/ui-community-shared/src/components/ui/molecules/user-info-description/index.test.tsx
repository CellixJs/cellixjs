import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { UserInfoDescription } from './index.tsx';

describe('UserInfoDescription', () => {
	it('renders label and value', () => {
		render(<UserInfoDescription label="User ID" value="test-id-123" />);
		expect(screen.getByText('User ID')).toBeDefined();
		expect(screen.getByText('test-id-123')).toBeDefined();
	});

	it('renders unknown when value is not provided', () => {
		render(<UserInfoDescription />);
		expect(screen.getByText('Unknown')).toBeDefined();
	});

	it('applies token-driven layout classes', () => {
		render(<UserInfoDescription label="User ID" value="test-id-123" />);
		const label = screen.getByText('User ID');
		expect(label.classList.contains('uppercase')).toBe(true);
		expect(label.classList.contains('font-outfit')).toBe(true);
	});
});
