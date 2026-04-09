import type { Domain } from '@ocom/domain';
import type { DataSources } from '@ocom/persistence';

export interface MemberCreateCommand {
	memberName: string;
	communityId: string;
}

export const create = (dataSources: DataSources) => {
	return async (command: MemberCreateCommand): Promise<Domain.Contexts.Community.Member.MemberEntityReference> => {
		const community = await dataSources.readonlyDataSource.Community.Community.CommunityReadRepo.getById(command.communityId);
		if (!community) {
			throw new Error(`Community not found for id ${command.communityId}`);
		}
		let memberToReturn: Domain.Contexts.Community.Member.MemberEntityReference | undefined;
		await dataSources.domainDataSource.Community.Member.MemberUnitOfWork.withScopedTransaction(async (repo) => {
			const newMember = await repo.getNewInstance(command.memberName, community);
			memberToReturn = await repo.save(newMember);
		});
		if (!memberToReturn) {
			throw new Error('member not created');
		}
		return memberToReturn;
	};
};
