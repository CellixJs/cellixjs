import type { Domain } from '@ocom/domain';
import type { DataSources } from '@ocom/persistence';

export interface MemberRemoveAccountCommand {
	memberId: string;
	accountId: string;
}

export const removeAccount = (dataSources: DataSources) => {
	return async (command: MemberRemoveAccountCommand): Promise<Domain.Contexts.Community.Member.MemberEntityReference> => {
		let memberToReturn: Domain.Contexts.Community.Member.MemberEntityReference | undefined;
		await dataSources.domainDataSource.Community.Member.MemberUnitOfWork.withScopedTransaction(async (repo) => {
			const member = await repo.getById(command.memberId);
			if (!member) {
				throw new Error(`Member not found for id ${command.memberId}`);
			}
			const accountProps = member.props.accounts.items.find((a: { id: string }) => a.id === command.accountId);
			if (!accountProps) {
				throw new Error(`Account not found for id ${command.accountId}`);
			}
			member.requestRemoveAccount(accountProps);
			memberToReturn = await repo.save(member);
		});
		if (!memberToReturn) {
			throw new Error('member not found');
		}
		return memberToReturn;
	};
};
