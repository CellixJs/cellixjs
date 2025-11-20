import type { DomainDataSource } from '../../../index.ts';
import type * as Community from '../../contexts/community/community-aggregate.ts';
import * as Member from '../../contexts/community/member.ts';
import type * as Role from '../../contexts/community/role.ts';
import { PassportFactory } from '../../contexts/passport.ts';

export class CommunityProvisioningService {
	async provisionMemberAndDefaultRole(
		communityId: string,
		domainDataSource: DomainDataSource,
	): Promise<void> {
		let communityDo: Community.Community<Community.CommunityProps> | null =
			null;
		await domainDataSource.Community.Community.CommunityUnitOfWork.withScopedTransaction(
			async (repo) => {
				communityDo = await repo.getByIdWithCreatedBy(communityId);
			},
		);
		if (!communityDo) {
			throw new Error('Community not found');
		}

		const systemPassportForEndUserRole = PassportFactory.forSystem({
			canManageEndUserRolesAndPermissions: true,
		});
		// create the default admin role for the community
		let role: Role.EndUserRole.EndUserRoleEntityReference | null = null;
		await domainDataSource.Community.Role.EndUserRole.EndUserRoleUnitOfWork.withTransaction(
			systemPassportForEndUserRole,
			async (repo) => {
				const newRole = await repo.getNewInstance(
					'admin',
					true,
					communityDo as Community.CommunityEntityReference,
				);
				newRole.permissions.setDefaultAdminPermissions();
				role = await repo.save(newRole);
			},
		);

		const { createdBy } =
			communityDo as Community.Community<Community.CommunityProps>;

		if (!role) {
			throw new Error(
				`Failed to provision default role for Community ID ${communityId}`,
			);
		}
		if (!createdBy) {
			throw new Error(
				`CreatedBy ID is required to provision member and default role for Community ID ${communityId}`,
			);
		}

		const systemPassportForMember = PassportFactory.forSystem({
			canManageMembers: true,
		});
		await domainDataSource.Community.Member.MemberUnitOfWork.withTransaction(
			systemPassportForMember,
			async (repo) => {
				const newMember = await repo.getNewInstance(
					createdBy.displayName,
					communityDo as Community.CommunityEntityReference,
				);
				newMember.role = role as Role.EndUserRole.EndUserRoleEntityReference;
				const newAccount = newMember.requestNewAccount();
				newAccount.createdBy = createdBy;
				newAccount.firstName =
					createdBy.personalInformation.identityDetails?.restOfName ?? '';
				newAccount.lastName =
					createdBy.personalInformation.identityDetails?.lastName;
				newAccount.statusCode = Member.MemberAccountStatusCodes.Accepted;
				newAccount.user = createdBy;
				await repo.save(newMember);
			},
		);
	}
}
