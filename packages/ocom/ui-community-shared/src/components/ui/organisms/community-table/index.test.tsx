import { fireEvent, render, screen } from '@testing-library/react';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { CommunityTable } from './index.tsx';

const communities = [
	{ id: '1', name: 'Riverside Community' },
	{ id: '2', name: 'Tech Team Community' },
];

const members = [
	[
		{ id: 'm1', memberName: 'Olivia K.', isAdmin: true },
		{ id: 'm2', memberName: 'John D.', isAdmin: false },
	],
	[{ id: 'm3', memberName: 'Jane S.', isAdmin: true }],
];

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

describe('CommunityTable', () => {
	it('renders communities and column headers', () => {
		render(<CommunityTable communities={communities} members={members} />);
		expect(screen.getByText('Riverside Community')).toBeDefined();
		expect(screen.getByText('Tech Team Community')).toBeDefined();
		expect(screen.getByText('Community Name')).toBeDefined();
		expect(screen.getByText('Member Portal')).toBeDefined();
		expect(screen.getByText('Admin Portal')).toBeDefined();
	});

	it('filters communities by search', () => {
		render(<CommunityTable communities={communities} members={members} />);
		const searchInput = screen.getByPlaceholderText(/search for a community/i);
		fireEvent.change(searchInput, { target: { value: 'Riverside' } });
		expect(screen.getByText('Riverside Community')).toBeDefined();
		expect(screen.queryByText('Tech Team Community')).toBeNull();
	});

	it('calls onCreateCommunity when create button is clicked', () => {
		const handleCreate = vi.fn();
		render(<CommunityTable communities={communities} members={members} onCreateCommunity={handleCreate} />);
		fireEvent.click(screen.getByRole('button', { name: /create a community/i }));
		expect(handleCreate).toHaveBeenCalled();
	});

	it('renders the section title as an uppercase heading', () => {
		render(<CommunityTable communities={communities} members={members} />);
		const heading = screen.getByRole('heading', { name: /navigate to a community/i });
		expect(heading.tagName).toBe('H3');
		expect(heading.classList.contains('uppercase')).toBe(true);
	});

	it('positions pagination at the bottom of the table', () => {
		render(<CommunityTable communities={communities} members={members} />);
		expect(screen.getAllByText('Member Portals').length).toBeGreaterThan(0);
		const paginationItems = document.querySelectorAll('.ant-pagination-item');
		expect(paginationItems.length).toBeGreaterThan(0);
	});
});
