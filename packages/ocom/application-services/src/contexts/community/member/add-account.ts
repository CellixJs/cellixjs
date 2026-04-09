import { Domain } from '@ocom/domain';
import type { DataSources } from '@ocom/persistence';

export interface MemberAddAccountCommand {
	memberId: string;
	firstName: string;
	lastName: string;
	userId: string;
}

export const addAccount = (dataSources: DataSources) => {
	return async (command: MemberAddAccountCommand): Promise<Domain.Contexts.Community.Member.MemberEntityReference> => {
		const user = await dataSources.readonlyDataSource.User.EndUser.EndUserReadRepo.getById(command.userId);
		if (!user) {
			throw new Error(`User not found for id ${command.userId}`);
		}
		let memberToReturn: Domain.Contexts.Community.Member.MemberEntityReference | undefined;
		await dataSources.domainDataSource.Community.Member.MemberUnitOfWork.withScopedTransaction(async (repo) => {
			const member = await repo.getById(command.memberId);
			if (!member) {
				throw new Error(`Member not found for id ${command.memberId}`);
			}
			const account = member.requestNewAccount();
			account.firstName = command.firstName;
			account.lastName = command.lastName;
			account.user = user;
			account.createdBy = user;
			account.statusCode = Domain.Contexts.Community.Member.MemberAccountStatusCodes.Created;
			memberToReturn = await repo.save(member);
		});
		if (!memberToReturn) {
			throw new Error('member not found');
		}
		return memberToReturn;
	};
};
