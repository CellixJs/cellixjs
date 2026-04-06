import type { Domain } from '@ocom/domain';
import type { DataSources } from '@ocom/persistence';

export interface MemberRemoveCommand {
	memberId: string;
}

export const removeMember = (dataSources: DataSources) => {
	return async (command: MemberRemoveCommand): Promise<Domain.Contexts.Community.Member.MemberEntityReference> => {
		let memberToReturn: Domain.Contexts.Community.Member.MemberEntityReference | undefined;
		await dataSources.domainDataSource.Community.Member.MemberUnitOfWork.withScopedTransaction(async (repo) => {
			const member = await repo.getById(command.memberId);
			member.requestDelete();
			memberToReturn = await repo.save(member);
		});
		if (!memberToReturn) {
			throw new Error('Member not found');
		}
		return memberToReturn;
	};
};
