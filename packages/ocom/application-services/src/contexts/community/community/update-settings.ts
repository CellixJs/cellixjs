import type { Domain } from '@ocom/domain';
import type { DataSources } from '@ocom/persistence';

export interface CommunityUpdateSettingsCommand {
	id: string;
	name?: string;
	domain?: string;
	whiteLabelDomain?: string | null;
	handle?: string | null;
}

export const updateSettings = (
	dataSources: DataSources
) => {
	return async (
		command: CommunityUpdateSettingsCommand,
	): Promise<Domain.Contexts.Community.Community.CommunityEntityReference> => {
		let communityToReturn: Domain.Contexts.Community.Community.CommunityEntityReference | undefined;
		await dataSources.domainDataSource.Community.Community.CommunityUnitOfWork.withScopedTransaction(
			async (repo) => {
				const community = await repo.get(command.id);
				if (!community) {
					throw new Error(`Community not found for id ${command.id}`);
				}
				
				if (command.name !== undefined) {
					community.name = command.name;
				}
				if (command.domain !== undefined) {
					community.domain = command.domain;
				}
				if (command.whiteLabelDomain !== undefined) {
					community.whiteLabelDomain = command.whiteLabelDomain;
				}
				if (command.handle !== undefined) {
					community.handle = command.handle;
				}
				
				communityToReturn = await repo.save(community);
			},
		);
		if (!communityToReturn) { throw new Error('community not found'); }
		return communityToReturn;
	};
};
