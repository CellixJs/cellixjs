import type { GraphQLResolveInfo } from 'graphql';
import { describe, expect, it, vi } from 'vitest';
import type { MutationStaffRoleUpdateArgs, RequireFields } from '../builder/generated.ts';
import type { GraphContext } from '../context.ts';
import { buildStaffRoleCreateCommand, buildStaffRoleUpdateCommand } from './staff-role.command-mapper.ts';
import staffRoleResolvers from './staff-role.resolvers.ts';

type StaffRoleUpdateInput = RequireFields<MutationStaffRoleUpdateArgs, 'input'>['input'];
type MutationResult = { status: { success: boolean; errorMessage?: string } };

const baseInput = (overrides?: Partial<StaffRoleUpdateInput>): StaffRoleUpdateInput =>
	({
		id: 'role-1',
		roleName: 'Renamed Role',
		enterpriseAppRole: 'Staff.CaseManager',
		...overrides,
	}) as StaffRoleUpdateInput;

describe('buildStaffRoleUpdateCommand', () => {
	it('rejects a blank enterprise app role', () => {
		const result = buildStaffRoleUpdateCommand(baseInput({ enterpriseAppRole: '' }), ['Staff.TechAdmin']);
		expect(result).toHaveProperty('errorMessage');
		expect((result as { errorMessage: string }).errorMessage).toContain('enterprise app role is required');
	});

	it('rejects a whitespace-only enterprise app role', () => {
		const result = buildStaffRoleUpdateCommand(baseInput({ enterpriseAppRole: '   ' }), ['Staff.TechAdmin']);
		expect(result).toHaveProperty('errorMessage');
		expect((result as { errorMessage: string }).errorMessage).toContain('enterprise app role is required');
	});

	it('rejects updates when the requested enterprise app role is above the caller tier', () => {
		const result = buildStaffRoleUpdateCommand(baseInput({ enterpriseAppRole: 'Staff.TechAdmin' }), ['Staff.CaseManager']);
		expect(result).toHaveProperty('errorMessage');
		expect((result as { errorMessage: string }).errorMessage).toContain('update a role to enterprise app role type: Staff.TechAdmin');
	});

	it('builds the command with the trimmed enterprise app role and the caller context', () => {
		const result = buildStaffRoleUpdateCommand(baseInput({ enterpriseAppRole: ' Staff.CaseManager ' }), ['Staff.TechAdmin']);
		expect(result).toStrictEqual({
			roleId: 'role-1',
			roleName: 'Renamed Role',
			enterpriseAppRole: 'Staff.CaseManager',
			callerContext: {
				allowedEnterpriseAppRoles: ['Staff.CaseManager', 'Staff.ServiceLineOwner', 'Staff.Finance', 'Staff.TechAdmin'],
				canManageUnclassifiedRoles: true,
				grantablePermissionFlags: expect.arrayContaining(['canManageTechAdmin', 'canManageAllCommunities']) as unknown as string[],
			},
		});
	});

	it('marks only tech admins as able to manage unclassified roles', () => {
		const techAdmin = buildStaffRoleUpdateCommand(baseInput(), ['Staff.TechAdmin']);
		const caseManager = buildStaffRoleUpdateCommand(baseInput(), ['Staff.CaseManager']);
		expect((techAdmin as { callerContext: { canManageUnclassifiedRoles: boolean } }).callerContext.canManageUnclassifiedRoles).toBe(true);
		expect((caseManager as { callerContext: { canManageUnclassifiedRoles: boolean } }).callerContext.canManageUnclassifiedRoles).toBe(false);
	});

	it('limits a case manager to their own tier in the caller context', () => {
		const result = buildStaffRoleUpdateCommand(baseInput(), ['Staff.CaseManager']);
		expect((result as { callerContext: { allowedEnterpriseAppRoles: string[] } }).callerContext.allowedEnterpriseAppRoles).toStrictEqual(['Staff.CaseManager']);
	});
});

describe('buildStaffRoleUpdateCommand - caller context grantable flags', () => {
	type CommandWithContext = { callerContext: { grantablePermissionFlags: string[] }; permissions?: unknown };

	it('limits a case manager to their tier flags', () => {
		const result = buildStaffRoleUpdateCommand(baseInput(), ['Staff.CaseManager']) as CommandWithContext;
		expect(result.callerContext.grantablePermissionFlags).toStrictEqual(['canManageCommunities', 'canManageStaffRolesAndPermissions', 'canManageUsers', 'canAssignStaffRoles', 'canViewStaffUsers', 'canViewRoles']);
	});

	it('grants a tech admin every permission flag', () => {
		const result = buildStaffRoleUpdateCommand(baseInput(), ['Staff.TechAdmin']) as CommandWithContext;
		expect(result.callerContext.grantablePermissionFlags).toHaveLength(22);
		expect(result.callerContext.grantablePermissionFlags).toContain('canManageTechAdmin');
		expect(result.callerContext.grantablePermissionFlags).toContain('canManageAllCommunities');
	});

	it('unions grantable flags across the caller enterprise app roles', () => {
		const result = buildStaffRoleUpdateCommand(baseInput(), ['Staff.CaseManager', 'Staff.Finance']) as CommandWithContext;
		expect(result.callerContext.grantablePermissionFlags).toContain('canManageFinance');
		expect(result.callerContext.grantablePermissionFlags).toContain('canManageCommunities');
		expect(result.callerContext.grantablePermissionFlags).not.toContain('canManageTechAdmin');
	});

	it('forwards permission payloads unchanged - grants are gated in the application service transaction', () => {
		const input = baseInput({ permissions: { techAdminPermissions: { canManageTechAdmin: true } } });
		const result = buildStaffRoleUpdateCommand(input, ['Staff.CaseManager']) as CommandWithContext;
		expect(result).not.toHaveProperty('errorMessage');
		expect(result.permissions).toStrictEqual({ techAdmin: { canManageTechAdmin: true } });
		expect(result.callerContext.grantablePermissionFlags).not.toContain('canManageTechAdmin');
	});
});

describe('buildStaffRoleCreateCommand - permission grant gate', () => {
	it('rejects a case manager creating a role with a tech admin permission', () => {
		const input = {
			roleName: 'Escalated Role',
			enterpriseAppRole: 'Staff.CaseManager',
			permissions: { techAdminPermissions: { canManageTechAdmin: true } },
		} as NonNullable<Parameters<typeof buildStaffRoleCreateCommand>[0]>;
		const result = buildStaffRoleCreateCommand(input, ['Staff.CaseManager']);
		expect(result).toHaveProperty('errorMessage');
		expect((result as { errorMessage: string }).errorMessage).toContain('grant the permission: canManageTechAdmin');
	});

	it('allows a case manager to create a role with permissions within their tier', () => {
		const input = {
			roleName: 'Intake Role',
			enterpriseAppRole: 'Staff.CaseManager',
			permissions: { userPermissions: { canViewStaffUsers: true } },
		} as NonNullable<Parameters<typeof buildStaffRoleCreateCommand>[0]>;
		const result = buildStaffRoleCreateCommand(input, ['Staff.CaseManager']);
		expect(result).not.toHaveProperty('errorMessage');
	});

	it('allows a tech admin to create a role with any permissions', () => {
		const input = {
			roleName: 'Full Access Role',
			enterpriseAppRole: 'Staff.TechAdmin',
			permissions: { techAdminPermissions: { canManageTechAdmin: true }, communityPermissions: { canManageAllCommunities: true } },
		} as NonNullable<Parameters<typeof buildStaffRoleCreateCommand>[0]>;
		const result = buildStaffRoleCreateCommand(input, ['Staff.TechAdmin']);
		expect(result).not.toHaveProperty('errorMessage');
	});
});

describe('staff-role.resolvers - staffRoleUpdate unit tests', () => {
	const invokeUpdate = async (ctx: GraphContext, input: StaffRoleUpdateInput) => {
		const Mutation = staffRoleResolvers.Mutation as NonNullable<typeof staffRoleResolvers.Mutation>;
		const staffRoleUpdate = Mutation.staffRoleUpdate as unknown as (parent: unknown, args: { input: StaffRoleUpdateInput }, context: GraphContext, info: GraphQLResolveInfo) => Promise<MutationResult>;
		return await staffRoleUpdate(null, { input }, ctx, {} as unknown as GraphQLResolveInfo);
	};

	const buildContext = (options: { callerRoles: string[]; updateError?: Error }) => {
		const update = options.updateError ? vi.fn().mockRejectedValue(options.updateError) : vi.fn().mockResolvedValue({ id: 'role-1', roleName: 'Renamed Role' });
		const ctx = {
			applicationServices: {
				verifiedUser: { verifiedJwt: { sub: 'actor-1', roles: options.callerRoles } },
				User: { StaffRole: { update } },
			},
		} as unknown as GraphContext;
		return { ctx, update };
	};

	it('rejects a blank enterprise app role without calling the application service', async () => {
		const { ctx, update } = buildContext({ callerRoles: ['Staff.CaseManager'] });

		const result = await invokeUpdate(ctx, baseInput({ enterpriseAppRole: '' }));

		expect(result.status.success).toBe(false);
		expect(result.status.errorMessage).toContain('enterprise app role is required');
		expect(update).not.toHaveBeenCalled();
	});

	it('propagates the transactional tier rejection from the application service', async () => {
		const { ctx } = buildContext({
			callerRoles: ['Staff.CaseManager'],
			updateError: new Error('You do not have permission to update a role of enterprise app role type: Staff.TechAdmin'),
		});

		const result = await invokeUpdate(ctx, baseInput());

		expect(result.status.success).toBe(false);
		expect(result.status.errorMessage).toContain('do not have permission to update a role of enterprise app role type: Staff.TechAdmin');
	});

	it('propagates the transactional not-found error from the application service', async () => {
		const { ctx } = buildContext({ callerRoles: ['Staff.TechAdmin'], updateError: new Error('Staff role not found') });

		const result = await invokeUpdate(ctx, baseInput());

		expect(result.status.success).toBe(false);
		expect(result.status.errorMessage).toContain('not found');
	});

	it('updates the role and passes the caller context to the application service', async () => {
		const { ctx, update } = buildContext({ callerRoles: ['Staff.TechAdmin'] });

		const result = await invokeUpdate(ctx, baseInput());

		expect(result.status.success).toBe(true);
		expect(update).toHaveBeenCalledWith({
			roleId: 'role-1',
			roleName: 'Renamed Role',
			enterpriseAppRole: 'Staff.CaseManager',
			callerContext: {
				allowedEnterpriseAppRoles: ['Staff.CaseManager', 'Staff.ServiceLineOwner', 'Staff.Finance', 'Staff.TechAdmin'],
				canManageUnclassifiedRoles: true,
				grantablePermissionFlags: expect.arrayContaining(['canManageTechAdmin']) as unknown as string[],
			},
		});
	});

	it('propagates the transactional grant rejection from the application service', async () => {
		const { ctx } = buildContext({
			callerRoles: ['Staff.CaseManager'],
			updateError: new Error('You do not have permission to grant the permission: canManageTechAdmin'),
		});

		const result = await invokeUpdate(ctx, baseInput({ permissions: { techAdminPermissions: { canManageTechAdmin: true } } }));

		expect(result.status.success).toBe(false);
		expect(result.status.errorMessage).toContain('grant the permission: canManageTechAdmin');
	});

	it('forwards the caller grantable flags so the service can allow unchanged elevated flags', async () => {
		const { ctx, update } = buildContext({ callerRoles: ['Staff.CaseManager'] });

		const result = await invokeUpdate(ctx, baseInput({ permissions: { techAdminPermissions: { canManageTechAdmin: true } } }));

		expect(result.status.success).toBe(true);
		const command = update.mock.calls[0]?.[0] as { permissions?: unknown; callerContext: { grantablePermissionFlags: string[] } };
		expect(command.permissions).toStrictEqual({ techAdmin: { canManageTechAdmin: true } });
		expect(command.callerContext.grantablePermissionFlags).not.toContain('canManageTechAdmin');
	});
});
