import type { Domain } from '@ocom/domain';
import type { DataSources } from '@ocom/persistence';

export interface MemberAddCommand {
	communityId: string;
	memberName: string;
	firstName: string;
	lastName?: string;
	userExternalId: string;
	createdByExternalId: string;
}

export const addMember = (dataSources: DataSources) => {
	return async (command: MemberAddCommand): Promise<Domain.Contexts.Community.Member.MemberEntityReference> => {
		const user = await dataSources.readonlyDataSource.User.EndUser.EndUserReadRepo.getByExternalId(command.userExternalId);
		if (!user) {
			throw new Error(`End user not found for external id ${command.userExternalId}`);
		}
		const createdBy = await dataSources.readonlyDataSource.User.EndUser.EndUserReadRepo.getByExternalId(command.createdByExternalId);
		if (!createdBy) {
			throw new Error(`Admin user not found for external id ${command.createdByExternalId}`);
		}
		const community = await dataSources.readonlyDataSource.Community.Community.CommunityReadRepo.getById(command.communityId);
		if (!community) {
			throw new Error(`Community not found for id ${command.communityId}`);
		}

		let memberToReturn: Domain.Contexts.Community.Member.MemberEntityReference | undefined;
		await dataSources.domainDataSource.Community.Member.MemberUnitOfWork.withScopedTransaction(async (repo) => {
			const newMember = await repo.getNewInstance(command.memberName, community as Domain.Contexts.Community.Community.CommunityEntityReference);
			const newAccount = newMember.requestNewAccount();
			newAccount.createdBy = createdBy;
			newAccount.firstName = command.firstName;
			newAccount.lastName = command.lastName ?? '';
			newAccount.statusCode = 'CREATED';
			newAccount.user = user;
			memberToReturn = await repo.save(newMember);
		});
		if (!memberToReturn) {
			throw new Error('Member not created');
		}
		return memberToReturn;
	};
};
