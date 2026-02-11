import type { Domain } from '@ocom/domain';
import type { DataSources } from '@ocom/persistence';
import { type MemberQueryByEndUserExternalIdCommand, queryByEndUserExternalId } from './query-by-end-user-external-id.ts';
import { determineIfAdmin, type MemberDetermineIfAdminCommand } from './determine-if-admin.ts';
import { updateMember, type MemberUpdateCommand } from './update.ts';

export interface MemberApplicationService {
	determineIfAdmin: (command: MemberDetermineIfAdminCommand) => Promise<boolean>,
	queryByEndUserExternalId: (command: MemberQueryByEndUserExternalIdCommand) => Promise<Domain.Contexts.Community.Member.MemberEntityReference[]>,
	updateMember: (command: MemberUpdateCommand) => Promise<void>,
}

export const Member = (
	dataSources: DataSources
): MemberApplicationService => {
	return {
		determineIfAdmin: determineIfAdmin(dataSources),
		queryByEndUserExternalId: queryByEndUserExternalId(dataSources),
		updateMember: updateMember(dataSources),
	}
}