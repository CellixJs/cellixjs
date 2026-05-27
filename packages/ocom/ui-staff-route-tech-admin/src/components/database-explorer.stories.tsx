import DatabaseExplorer from './database-explorer.tsx';

export default { title: 'Tech Admin/Database Explorer' };

export const Default = () => (
	<DatabaseExplorer
		collections={["users","orders"]}
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
	/>
);
