import type React from 'react';
import { useMemo, useState } from 'react';
import { useQuery, gql } from '@apollo/client';
import DatabaseExplorer from './database-explorer.tsx';
import { ComponentQueryLoader } from '@cellix/ui-core';
import type { DatabaseDocument } from './database-explorer.tsx';
import { Empty } from 'antd';

const COLLECTIONS_QUERY = gql`
query TechAdminDatabaseExplorerContainerCollections {
  techAdminDatabaseCollections
}
`;

const DOCUMENTS_QUERY = gql`
query TechAdminDatabaseExplorerContainerDocuments($collection: String!, $filter: String, $page: Int, $pageSize: Int) {
  techAdminDatabaseDocuments(collection: $collection, filter: $filter, page: $page, pageSize: $pageSize) {
    documents { id json }
    totalCount
  }
}
`;

interface DocumentsQueryResult {
	techAdminDatabaseDocuments: {
		documents: { id: string; json: string }[];
		totalCount: number;
	};
}

export const DatabaseExplorerContainer: React.FC = () => {
	const [selectedCollection, setSelectedCollection] = useState<string | undefined>(undefined);
	const [filter, setFilter] = useState<string>('');
	const [page, setPage] = useState<number>(1);
	const [pageSize, setPageSize] = useState<number>(20);

	const { data: collectionsData, loading: collectionsLoading, error: collectionsError } = useQuery<{ techAdminDatabaseCollections: string[] }>(COLLECTIONS_QUERY, { fetchPolicy: 'cache-first' });

	const variables = useMemo(() => ({ collection: selectedCollection ?? '', filter: filter ?? undefined, page, pageSize }), [selectedCollection, filter, page, pageSize]);
	const { data: documentsData, loading: documentsLoading } = useQuery<DocumentsQueryResult>(DOCUMENTS_QUERY, {
		variables,
		skip: !selectedCollection,
		pollInterval: 5000,
	});

	const collections = collectionsData?.techAdminDatabaseCollections ?? [];
	const documents: DatabaseDocument[] = (documentsData?.techAdminDatabaseDocuments?.documents ?? []).map((d: { id: string; json: string }) => ({ id: d.id, json: d.json }));
	const totalCount = documentsData?.techAdminDatabaseDocuments?.totalCount ?? 0;

	return (
		<ComponentQueryLoader
			error={collectionsError}
			loading={collectionsLoading}
			hasData={collections}
			hasDataComponent={
				collections.length === 0 ? (
					<Empty description="No collections available" />
				) : (
					<DatabaseExplorer
						collections={collections}
						selectedCollection={selectedCollection ?? ''}
						onSelectCollection={(c: string) => { setSelectedCollection(c); setPage(1); }}
						filter={filter}
						onChangeFilter={setFilter}
						onApplyFilter={() => { setPage(1); }}
						documents={documents}
						totalCount={totalCount}
						page={page}
						pageSize={pageSize}
						onChangePage={(p: number, ps?: number) => { setPage(p); if (ps) setPageSize(ps); }}
						loading={documentsLoading}
					/>
				)
			}
			noDataComponent={<Empty description="No collections" />}
		/> 
	);
};

export default DatabaseExplorerContainer;
