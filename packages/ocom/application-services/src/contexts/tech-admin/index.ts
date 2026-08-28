import { ListCollections } from './list-collections.ts';
import { DatabaseDocuments } from './query-documents.ts';
export { buildDatabaseDocumentsQueryCommand } from './database-documents.command-mapper.ts';

export interface TechAdminApplicationService {
	ListCollections: ReturnType<typeof ListCollections>;
	DatabaseDocuments: ReturnType<typeof DatabaseDocuments>;
}

export const TechAdmin = (): TechAdminApplicationService => {
	return {
		ListCollections: ListCollections(),
		DatabaseDocuments: DatabaseDocuments(),
	};
};
