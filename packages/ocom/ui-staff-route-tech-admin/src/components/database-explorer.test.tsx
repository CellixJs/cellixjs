import { render, screen } from '@testing-library/react';
import { expect, test } from 'vitest';
import DatabaseExplorer from './database-explorer.tsx';

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
