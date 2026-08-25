import type { Domain } from '@ocom/domain';
import type { DataSources } from '@ocom/persistence';
import type { StaffRoleCommandPermissions } from './apply-permissions.ts';
import { applyCommunityPermissions, applyFinancePermissions, applyRolePermissions, applyTechAdminPermissions, applyUserPermissions, findForbiddenPermissionGrant } from './apply-permissions.ts';

/**
 * Caller allowances computed at the API boundary (from the verified JWT's
 * enterprise app roles) and enforced here against the aggregate fetched
 * inside the unit of work, so authorization binds to the same snapshot that
 * gets mutated rather than to a stale pre-transaction read.
 */
export interface StaffRoleUpdateCallerContext {
	/** Enterprise app role tiers whose roles the caller may modify. */
	allowedEnterpriseAppRoles: string[];
	/** Whether the caller may modify roles without a persisted classification. */
	canManageUnclassifiedRoles: boolean;
	/** Permission flags the caller may newly grant. */
	grantablePermissionFlags: string[];
}

export interface StaffRoleUpdateCommand {
	roleId: string;
	roleName: string | undefined;
	enterpriseAppRole?: string;
	permissions?: StaffRoleCommandPermissions;
	callerContext: StaffRoleUpdateCallerContext;
}

export const update = (dataSources: DataSources) => {
	return async (command: StaffRoleUpdateCommand): Promise<Domain.Contexts.User.StaffRole.StaffRoleEntityReference> => {
		let updatedRole: Domain.Contexts.User.StaffRole.StaffRoleEntityReference | undefined;

		await dataSources.domainDataSource.User.StaffRole.StaffRoleUnitOfWork.withScopedTransaction(async (repository) => {
			let staffRole: Awaited<ReturnType<typeof repository.getById>>;
			try {
				staffRole = await repository.getById(command.roleId);
			} catch (error) {
				if ((error as Error)?.name === 'NotFoundError') {
					throw new Error('Staff role not found');
				}
				throw error;
			}
			// A role without a persisted classification fails closed: only callers
			// allowed to manage unclassified roles may modify it, so lower tiers
			// cannot rewrite an unclassified role that carries elevated permissions.
			const currentTier = (staffRole.enterpriseAppRole ?? '').trim();
			if (!currentTier) {
				if (!command.callerContext.canManageUnclassifiedRoles) {
					throw new Error('You do not have permission to update a role without an enterprise app role type');
				}
			} else if (!command.callerContext.allowedEnterpriseAppRoles.includes(currentTier)) {
				throw new Error(`You do not have permission to update a role of enterprise app role type: ${currentTier}`);
			}
			const forbiddenGrant = findForbiddenPermissionGrant(staffRole, command.permissions, command.callerContext.grantablePermissionFlags);
			if (forbiddenGrant) {
				throw new Error(`You do not have permission to grant the permission: ${forbiddenGrant}`);
			}
			if (command.roleName !== undefined) {
				staffRole.roleName = command.roleName;
			}
			if (command.enterpriseAppRole) {
				staffRole.enterpriseAppRole = command.enterpriseAppRole;
			}
			applyCommunityPermissions(staffRole, command.permissions?.community);
			applyUserPermissions(staffRole, command.permissions?.user);
			applyRolePermissions(staffRole, command.permissions?.staffRole);
			applyFinancePermissions(staffRole, command.permissions?.finance);
			applyTechAdminPermissions(staffRole, command.permissions?.techAdmin);
			updatedRole = await repository.save(staffRole);
		});

		if (!updatedRole) {
			throw new Error('Unable to update staff role');
		}

		return updatedRole;
	};
};
