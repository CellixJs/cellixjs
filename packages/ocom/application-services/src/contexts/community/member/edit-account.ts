import type { Domain } from '@ocom/domain';
import type { DataSources } from '@ocom/persistence';

export interface MemberEditAccountCommand {
	memberId: string;
	accountId: string;
	firstName?: string;
	lastName?: string;
	statusCode?: string;
}

export const editAccount = (dataSources: DataSources) => {
	return async (command: MemberEditAccountCommand): Promise<Domain.Contexts.Community.Member.MemberEntityReference> => {
		let memberToReturn: Domain.Contexts.Community.Member.MemberEntityReference | undefined;
		await dataSources.domainDataSource.Community.Member.MemberUnitOfWork.withScopedTransaction(async (repo) => {
			const member = await repo.getById(command.memberId);
			if (!member) {
				throw new Error(`Member not found for id ${command.memberId}`);
			}
			const account = member.accounts.find((a) => a.id === command.accountId);
			if (!account) {
				throw new Error(`Account not found for id ${command.accountId}`);
			}
			if (command.firstName !== undefined) {
				account.firstName = command.firstName;
			}
			if (command.lastName !== undefined) {
				account.lastName = command.lastName;
			}
			if (command.statusCode !== undefined) {
				account.statusCode = command.statusCode;
			}
			memberToReturn = await repo.save(member);
		});
		if (!memberToReturn) {
			throw new Error('member not found');
		}
		return memberToReturn;
	};
};
