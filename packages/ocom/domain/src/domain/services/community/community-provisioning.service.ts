import type { DomainDataSource } from '../../../index.ts';
import type { Community } from '../../contexts/community/index.ts';
import * as Member from '../../contexts/community/member/index.ts';
import type * as Role from '../../contexts/community/role/index.ts';
import { PassportFactory } from '../../contexts/passport.ts';

export class CommunityProvisioningService {
	async provisionMemberAndDefaultRole(communityId: string, domainDataSource: DomainDataSource): Promise<void> {
		let communityDo: Community.Community<Community.CommunityProps> | null = null;
		await domainDataSource.Community.Community.CommunityUnitOfWork.withScopedTransaction(async (repo) => {
			communityDo = await repo.getByIdWithCreatedBy(communityId);
		});
		if (!communityDo) {
			throw new Error('Community not found');
		}

		const systemPassportForMemberRead = PassportFactory.forSystem({
			canManageMembers: true,
			isSystemAccount: true,
		});
		let existingMembers: Member.MemberEntityReference[] = [];
		await domainDataSource.Community.Member.MemberUnitOfWork.withTransaction(systemPassportForMemberRead, async (repo) => {
			existingMembers = await repo.getByCommunityId(communityId);
		});
		if (existingMembers.length > 0) {
			return;
		}

		const systemPassportForEndUserRole = PassportFactory.forSystem({
			canManageEndUserRolesAndPermissions: true,
		});
		let role: Role.EndUserRole.EndUserRoleEntityReference | null = null;
		await domainDataSource.Community.Role.EndUserRole.EndUserRoleUnitOfWork.withTransaction(systemPassportForEndUserRole, async (repo) => {
			const existingRoles = await repo.getByCommunityId(communityId);
			const existingAdmin = existingRoles.find((existing) => existing.isDefault || existing.roleName === 'admin');
			if (existingAdmin) {
				role = existingAdmin;
				return;
			}
			try {
				const newRole = await repo.getNewInstance('admin', true, communityDo as Community.CommunityEntityReference);
				newRole.permissions.setDefaultAdminPermissions();
				role = await repo.save(newRole);
			} catch (error) {
				const rolesAfterConflict = await repo.getByCommunityId(communityId);
				role = rolesAfterConflict.find((existing) => existing.isDefault || existing.roleName === 'admin') ?? null;
				if (!role) {
					throw error;
				}
			}
		});

		const { createdBy } = communityDo as Community.Community<Community.CommunityProps>;

		if (!role) {
			throw new Error(`Failed to provision default role for Community ID ${communityId}`);
		}
		if (!createdBy) {
			throw new Error(`CreatedBy ID is required to provision member and default role for Community ID ${communityId}`);
		}

		const systemPassportForMember = PassportFactory.forSystem({
			canManageMembers: true,
		});
		await domainDataSource.Community.Member.MemberUnitOfWork.withTransaction(systemPassportForMember, async (repo) => {
			const membersNow = await repo.getByCommunityId(communityId);
			if (membersNow.length > 0) {
				return;
			}
			try {
				const newMember = await repo.getNewInstance(createdBy.displayName, communityDo as Community.CommunityEntityReference);
				newMember.role = role as Role.EndUserRole.EndUserRoleEntityReference;
				const newAccount = newMember.requestNewAccount();
				newAccount.createdBy = createdBy;
				newAccount.firstName = createdBy.personalInformation.identityDetails?.restOfName ?? '';
				newAccount.lastName = createdBy.personalInformation.identityDetails?.lastName;
				newAccount.statusCode = Member.MemberAccountStatusCodes.Accepted;
				newAccount.user = createdBy;
				await repo.save(newMember);
			} catch (error) {
				const membersAfterConflict = await repo.getByCommunityId(communityId);
				if (membersAfterConflict.length === 0) {
					throw error;
				}
			}
		});
	}
}
