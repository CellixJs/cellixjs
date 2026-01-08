import type { Domain } from '@ocom/domain';
import type { DataSources } from '@ocom/persistence';

export interface MemberUpdateCommand {
	id: string;
	memberName?: string;
}

export const update = (dataSources: DataSources) => {
	return async (
		command: MemberUpdateCommand,
	): Promise<Domain.Contexts.Community.Member.MemberEntityReference> => {
		let memberToReturn:
			| Domain.Contexts.Community.Member.MemberEntityReference
			| undefined;
		await dataSources.domainDataSource.Community.Member.MemberUnitOfWork.withScopedTransaction(
			async (repo) => {
				const member = await repo.getById(command.id);
				if (!member) {
					throw new Error(`Member not found for id ${command.id}`);
				}

				if (command.memberName !== undefined) {
					member.memberName = command.memberName;
				}

				memberToReturn = await repo.save(member);
			},
		);
		if (!memberToReturn) {
			throw new Error('Member not updated');
		}
		return memberToReturn;
	};
};
