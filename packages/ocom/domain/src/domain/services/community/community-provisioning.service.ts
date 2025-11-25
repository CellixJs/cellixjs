import type { DomainDataSource } from '../../../index.ts';
import {
	type CommunityEntityReference,
	MemberAccountStatusCodes,
	type EndUserRoleEntityReference,
} from '../../contexts/community.ts';
import type { EndUserEntityReference } from '../../contexts/user.ts';
import { PassportFactory } from '../../contexts/passport.ts';

export class CommunityProvisioningService {
	async provisionMemberAndDefaultRole(
		communityId: string,
		domainDataSource: DomainDataSource,
	): Promise<void> {
		let communityDo: CommunityEntityReference | null = null;
		await domainDataSource.Community.Community.CommunityUnitOfWork.withScopedTransaction(
			async (repo) => {
				communityDo = await repo.getByIdWithCreatedBy(communityId);
			},
		);
		if (!communityDo) {
			throw new Error('Community not found');
		}

		// Type assertion after null check
		const community: CommunityEntityReference = communityDo;

		const systemPassportForEndUserRole = PassportFactory.forSystem({
			canManageEndUserRolesAndPermissions: true,
		});
		// create the default admin role for the community
		let role: EndUserRoleEntityReference | null = null;
		await domainDataSource.Community.Role.EndUserRole.EndUserRoleUnitOfWork.withTransaction(
			systemPassportForEndUserRole,
			async (repo) => {
				const newRole = await repo.getNewInstance(
					'admin',
					true,
					community,
				);
				newRole.permissions.setDefaultAdminPermissions();
				role = await repo.save(newRole);
			},
		);

		const createdBy: Readonly<EndUserEntityReference> = community.createdBy;

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
					community,
				);
				newMember.role = role as EndUserRoleEntityReference;
				const newAccount = newMember.requestNewAccount();
				newAccount.createdBy = createdBy;
				newAccount.firstName =
					createdBy.personalInformation.identityDetails?.restOfName ?? '';
				newAccount.lastName =
					createdBy.personalInformation.identityDetails?.lastName;
				newAccount.statusCode = MemberAccountStatusCodes.Accepted;
				newAccount.user = createdBy;
				await repo.save(newMember);
			},
		);
	}
}
