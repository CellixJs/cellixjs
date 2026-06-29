import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, expect, test, vi } from 'vitest';
import { DatabaseExplorer } from './database-explorer.tsx';

const writeTextMock = vi.fn();

beforeEach(() => {
	writeTextMock.mockReset();
	Object.defineProperty(globalThis.navigator, 'clipboard', {
		value: { writeText: writeTextMock },
		configurable: true,
	});
});

test('renders database explorer title', () => {
	render(
		<DatabaseExplorer
			collections={['users']}
			selectedCollection="users"
			onSelectCollection={() => undefined}
			filter=""
			onChangeFilter={() => undefined}
			onApplyFilter={() => undefined}
			documents={[]}
			totalCount={0}
			page={1}
			pageSize={20}
			onChangePage={() => undefined}
		/>,
	);

	expect(screen.getByText(/Database Explorer/i)).toBeTruthy();
});

test('opens full JSON modal from action button', () => {
	render(
		<DatabaseExplorer
			collections={['users']}
			selectedCollection="users"
			onSelectCollection={() => undefined}
			filter=""
			onChangeFilter={() => undefined}
			onApplyFilter={() => undefined}
			documents={[{ id: '1', json: JSON.stringify({ name: 'Alice', age: 30 }) }]}
			totalCount={1}
			page={1}
			pageSize={20}
			onChangePage={() => undefined}
		/>,
	);

	fireEvent.click(screen.getByLabelText('Open JSON modal for 1'));

	expect(screen.getByText('Full JSON')).toBeTruthy();
	expect(screen.getByText(/"Alice"/)).toBeTruthy();
});

test('copies json when clipboard icon is clicked', () => {
	render(
		<DatabaseExplorer
			collections={['users']}
			selectedCollection="users"
			onSelectCollection={() => undefined}
			filter=""
			onChangeFilter={() => undefined}
			onApplyFilter={() => undefined}
			documents={[{ id: '1', json: JSON.stringify({ name: 'Alice', age: 30 }) }]}
			totalCount={1}
			page={1}
			pageSize={20}
			onChangePage={() => undefined}
		/>,
	);

	fireEvent.click(screen.getByLabelText('Copy JSON for 1'));

	expect(writeTextMock).toHaveBeenCalledWith('{"name":"Alice","age":30}');
});
