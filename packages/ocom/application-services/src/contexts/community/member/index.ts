import type { Domain } from '@ocom/domain';
import type { DataSources } from '@ocom/persistence';
import { type MemberQueryByEndUserExternalIdCommand, queryByEndUserExternalId } from './query-by-end-user-external-id.ts';
import { determineIfAdmin, type MemberDetermineIfAdminCommand } from './determine-if-admin.ts';
import { type MemberQueryByCommunityIdCommand, queryByCommunityId } from './query-by-community-id.ts';
import { addMember, type MemberAddCommand } from './add-member.ts';
import { removeMember, type MemberRemoveCommand } from './remove-member.ts';
import { updateMemberRole, type MemberRoleUpdateCommand } from './update-member-role.ts';

export interface MemberApplicationService {
	determineIfAdmin: (command: MemberDetermineIfAdminCommand) => Promise<boolean>;
	queryByEndUserExternalId: (command: MemberQueryByEndUserExternalIdCommand) => Promise<Domain.Contexts.Community.Member.MemberEntityReference[]>;
	queryByCommunityId: (command: MemberQueryByCommunityIdCommand) => Promise<Domain.Contexts.Community.Member.MemberEntityReference[]>;
	addMember: (command: MemberAddCommand) => Promise<Domain.Contexts.Community.Member.MemberEntityReference>;
	removeMember: (command: MemberRemoveCommand) => Promise<Domain.Contexts.Community.Member.MemberEntityReference>;
	updateMemberRole: (command: MemberRoleUpdateCommand) => Promise<Domain.Contexts.Community.Member.MemberEntityReference>;
}

export const Member = (dataSources: DataSources): MemberApplicationService => {
	return {
		determineIfAdmin: determineIfAdmin(dataSources),
		queryByEndUserExternalId: queryByEndUserExternalId(dataSources),
		queryByCommunityId: queryByCommunityId(dataSources),
		addMember: addMember(dataSources),
		removeMember: removeMember(dataSources),
		updateMemberRole: updateMemberRole(dataSources),
	};
};
