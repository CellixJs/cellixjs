import type { Domain } from '@ocom/domain';
import type { DataSources } from '@ocom/persistence';

export interface MemberRoleUpdateCommand {
	memberId: string;
	roleId: string;
}

export const updateMemberRole = (dataSources: DataSources) => {
	return async (command: MemberRoleUpdateCommand): Promise<Domain.Contexts.Community.Member.MemberEntityReference> => {
		let memberToReturn: Domain.Contexts.Community.Member.MemberEntityReference | undefined;
		await dataSources.domainDataSource.Community.Role.EndUserRole.EndUserRoleUnitOfWork.withScopedTransaction(async (roleRepo) => {
			const role = await roleRepo.getById(command.roleId);
			await dataSources.domainDataSource.Community.Member.MemberUnitOfWork.withScopedTransaction(async (memberRepo) => {
				const member = await memberRepo.getById(command.memberId);
				member.role = role as Domain.Contexts.Community.Role.EndUserRole.EndUserRoleEntityReference;
				memberToReturn = await memberRepo.save(member);
			});
		});
		if (!memberToReturn) {
			throw new Error('Member not found');
		}
		return memberToReturn;
	};
};
