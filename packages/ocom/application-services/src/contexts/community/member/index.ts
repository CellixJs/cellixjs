import type { Domain } from '@ocom/domain';
import type { DataSources } from '@ocom/persistence';
import { type MemberQueryByEndUserExternalIdCommand, queryByEndUserExternalId } from './query-by-end-user-external-id.ts';
import { determineIfAdmin, type MemberDetermineIfAdminCommand } from './determine-if-admin.ts';
import { type MemberListByCommunityIdCommand, listByCommunityId } from './list-by-community-id.ts';
import { type MemberGetByIdCommand, getById } from './get-by-id.ts';
import { type MemberCreateCommand, create } from './create.ts';
import { type MemberUpdateCommand, update } from './update.ts';
import { type MemberAddAccountCommand, addAccount } from './add-account.ts';
import { type MemberEditAccountCommand, editAccount } from './edit-account.ts';
import { type MemberRemoveAccountCommand, removeAccount } from './remove-account.ts';

export interface MemberApplicationService {
	determineIfAdmin: (command: MemberDetermineIfAdminCommand) => Promise<boolean>;
	queryByEndUserExternalId: (command: MemberQueryByEndUserExternalIdCommand) => Promise<Domain.Contexts.Community.Member.MemberEntityReference[]>;
	listByCommunityId: (command: MemberListByCommunityIdCommand) => Promise<Domain.Contexts.Community.Member.MemberEntityReference[]>;
	getById: (command: MemberGetByIdCommand) => Promise<Domain.Contexts.Community.Member.MemberEntityReference | null>;
	create: (command: MemberCreateCommand) => Promise<Domain.Contexts.Community.Member.MemberEntityReference>;
	update: (command: MemberUpdateCommand) => Promise<Domain.Contexts.Community.Member.MemberEntityReference>;
	addAccount: (command: MemberAddAccountCommand) => Promise<Domain.Contexts.Community.Member.MemberEntityReference>;
	editAccount: (command: MemberEditAccountCommand) => Promise<Domain.Contexts.Community.Member.MemberEntityReference>;
	removeAccount: (command: MemberRemoveAccountCommand) => Promise<Domain.Contexts.Community.Member.MemberEntityReference>;
}

export const Member = (dataSources: DataSources): MemberApplicationService => {
	return {
		determineIfAdmin: determineIfAdmin(dataSources),
		queryByEndUserExternalId: queryByEndUserExternalId(dataSources),
		listByCommunityId: listByCommunityId(dataSources),
		getById: getById(dataSources),
		create: create(dataSources),
		update: update(dataSources),
		addAccount: addAccount(dataSources),
		editAccount: editAccount(dataSources),
		removeAccount: removeAccount(dataSources),
	};
};
