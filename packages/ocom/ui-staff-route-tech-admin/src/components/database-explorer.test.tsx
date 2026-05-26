import { render, screen } from '@testing-library/react';
import DatabaseExplorer from './database-explorer';

test('renders database explorer title', () => {
	render(<DatabaseExplorer
		collections={["users"]}
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
	/>);

	expect(screen.getByText(/Database Explorer/i)).toBeInTheDocument();
});
