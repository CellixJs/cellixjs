import type { CommunityEntityReference } from '@ocom/domain/contexts/community/community';
import type { DataSources } from '@ocom/persistence';
import { type CommunityCreateCommand, create } from './create.ts';
import { type CommunityQueryByEndUserExternalIdCommand, queryByEndUserExternalId } from './query-by-end-user-external-id.ts';
import { type CommunityQueryByIdCommand, queryById } from './query-by-id.ts';

export interface CommunityApplicationService {
	create: (command: CommunityCreateCommand) => Promise<CommunityEntityReference>;
	queryById: (command: CommunityQueryByIdCommand) => Promise<CommunityEntityReference | null>;
	queryByEndUserExternalId: (
		command: CommunityQueryByEndUserExternalIdCommand,
	) => Promise<CommunityEntityReference[]>;
}

export const Community = (dataSources: DataSources): CommunityApplicationService => {
	return {
		create: create(dataSources),
		queryById: queryById(dataSources),
		queryByEndUserExternalId: queryByEndUserExternalId(dataSources),
	};
};