import type { Domain } from '@ocom/domain';
import type { DataSources } from '@ocom/persistence';
import { determineIfAdmin, type MemberDetermineIfAdminCommand } from './determine-if-admin.ts';
import {
	type ActivateMemberCommand,
	activateMember,
	type BulkActivateMembersCommand,
	type BulkDeactivateMembersCommand,
	type BulkMemberInviteCommand,
	type BulkRemoveMembersCommand,
	bulkActivateMembers,
	bulkDeactivateMembers,
	bulkInviteMembers,
	bulkRemoveMembers,
	createMember,
	createMemberAccount,
	type DeactivateMemberCommand,
	deactivateMember,
	inviteMember,
	type MemberCreateAccountCommand,
	type MemberCreateCommand,
	type MemberInviteCommand,
	type MemberRemoveAccountCommand,
	type MemberUpdateAccountCommand,
	type MemberUpdateProfileCommand,
	type RemoveMemberCommand,
	removeMember,
	removeMemberAccount,
	type UpdateMemberRoleCommand,
	updateMemberAccount,
	updateMemberProfile,
	updateMemberRole,
} from './member-management.ts';
import { type MemberQueryByCommunityIdCommand, queryByCommunityId } from './query-by-community-id.ts';
import { type MemberQueryByEndUserExternalIdCommand, queryByEndUserExternalId } from './query-by-end-user-external-id.ts';
import { type MemberQueryByIdCommand, queryById } from './query-by-id.ts';

export interface MemberApplicationService {
	determineIfAdmin: (command: MemberDetermineIfAdminCommand) => Promise<boolean>;
	queryById: (command: MemberQueryByIdCommand) => Promise<Domain.Contexts.Community.Member.MemberEntityReference>;
	queryByEndUserExternalId: (command: MemberQueryByEndUserExternalIdCommand) => Promise<Domain.Contexts.Community.Member.MemberEntityReference[]>;
	queryByCommunityId: (command: MemberQueryByCommunityIdCommand) => Promise<Domain.Contexts.Community.Member.MemberEntityReference[]>;

	// Member creation operations
	createMember: (command: MemberCreateCommand) => Promise<Domain.Contexts.Community.Member.MemberEntityReference>;

	// Member account operations
	createMemberAccount: (command: MemberCreateAccountCommand) => Promise<Domain.Contexts.Community.Member.MemberEntityReference>;
	updateMemberAccount: (command: MemberUpdateAccountCommand) => Promise<Domain.Contexts.Community.Member.MemberEntityReference>;
	removeMemberAccount: (command: MemberRemoveAccountCommand) => Promise<Domain.Contexts.Community.Member.MemberEntityReference>;
	updateMemberProfile: (command: MemberUpdateProfileCommand) => Promise<Domain.Contexts.Community.Member.MemberEntityReference>;

	// Member invitation operations
	inviteMember: (command: MemberInviteCommand) => Promise<Domain.Contexts.Community.Member.MemberInvitationEntityReference>;
	bulkInviteMembers: (command: BulkMemberInviteCommand) => Promise<Domain.Contexts.Community.Member.MemberInvitationEntityReference[]>;

	// Member management operations
	updateMemberRole: (command: UpdateMemberRoleCommand) => Promise<Domain.Contexts.Community.Member.MemberEntityReference>;
	activateMember: (command: ActivateMemberCommand) => Promise<Domain.Contexts.Community.Member.MemberEntityReference>;
	deactivateMember: (command: DeactivateMemberCommand) => Promise<Domain.Contexts.Community.Member.MemberEntityReference>;
	removeMember: (command: RemoveMemberCommand) => Promise<void>;

	// Bulk operations
	bulkActivateMembers: (command: BulkActivateMembersCommand) => Promise<Domain.Contexts.Community.Member.MemberEntityReference[]>;
	bulkDeactivateMembers: (command: BulkDeactivateMembersCommand) => Promise<Domain.Contexts.Community.Member.MemberEntityReference[]>;
	bulkRemoveMembers: (command: BulkRemoveMembersCommand) => Promise<void>;
}

export const Member = (dataSources: DataSources): MemberApplicationService => {
	return {
		determineIfAdmin: determineIfAdmin(dataSources),
		queryById: queryById(dataSources),
		queryByEndUserExternalId: queryByEndUserExternalId(dataSources),
		queryByCommunityId: queryByCommunityId(dataSources),

		// Member creation operations
		createMember: createMember(dataSources),

		// Member account operations
		createMemberAccount: createMemberAccount(dataSources),
		updateMemberAccount: updateMemberAccount(dataSources),
		removeMemberAccount: removeMemberAccount(dataSources),
		updateMemberProfile: updateMemberProfile(dataSources),

		// Member invitation operations
		inviteMember: inviteMember(dataSources),
		bulkInviteMembers: bulkInviteMembers(dataSources),

		// Member management operations
		updateMemberRole: updateMemberRole(dataSources),
		activateMember: activateMember(dataSources),
		deactivateMember: deactivateMember(dataSources),
		removeMember: removeMember(dataSources),

		// Bulk operations
		bulkActivateMembers: bulkActivateMembers(dataSources),
		bulkDeactivateMembers: bulkDeactivateMembers(dataSources),
		bulkRemoveMembers: bulkRemoveMembers(dataSources),
	};
};
