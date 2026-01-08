import type { Domain } from '@ocom/domain';
import type { DataSources } from '@ocom/persistence';
import {
	type MemberQueryByEndUserExternalIdCommand,
	queryByEndUserExternalId,
} from './query-by-end-user-external-id.ts';
import {
	determineIfAdmin,
	type MemberDetermineIfAdminCommand,
} from './determine-if-admin.ts';
import {
	type MemberQueryByCommunityIdCommand,
	queryByCommunityId,
} from './query-by-community-id.ts';
import { type MemberQueryByIdCommand, queryById } from './query-by-id.ts';
import { type MemberCreateCommand, create } from './create.ts';
import { type MemberUpdateCommand, update } from './update.ts';

export interface MemberApplicationService {
	determineIfAdmin: (
		command: MemberDetermineIfAdminCommand,
	) => Promise<boolean>;
	queryByEndUserExternalId: (
		command: MemberQueryByEndUserExternalIdCommand,
	) => Promise<Domain.Contexts.Community.Member.MemberEntityReference[]>;
	queryByCommunityId: (
		command: MemberQueryByCommunityIdCommand,
	) => Promise<Domain.Contexts.Community.Member.MemberEntityReference[]>;
	queryById: (
		command: MemberQueryByIdCommand,
	) => Promise<Domain.Contexts.Community.Member.MemberEntityReference | null>;
	create: (
		command: MemberCreateCommand,
	) => Promise<Domain.Contexts.Community.Member.MemberEntityReference>;
	update: (
		command: MemberUpdateCommand,
	) => Promise<Domain.Contexts.Community.Member.MemberEntityReference>;
}

export const Member = (
	dataSources: DataSources,
): MemberApplicationService => {
	return {
		determineIfAdmin: determineIfAdmin(dataSources),
		queryByEndUserExternalId: queryByEndUserExternalId(dataSources),
		queryByCommunityId: queryByCommunityId(dataSources),
		queryById: queryById(dataSources),
		create: create(dataSources),
		update: update(dataSources),
	};
};