import type { GraphQLResolveInfo } from 'graphql';
import { describe, expect, it, vi } from 'vitest';
import type { MutationStaffRoleUpdateArgs, RequireFields } from '../builder/generated.ts';
import type { GraphContext } from '../context.ts';
import { buildStaffRoleUpdateCommand } from './staff-role.command-mapper.ts';
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
		const result = buildStaffRoleUpdateCommand(baseInput({ enterpriseAppRole: '' }), ['Staff.TechAdmin'], 'Staff.CaseManager');
		expect(result).toHaveProperty('errorMessage');
		expect((result as { errorMessage: string }).errorMessage).toContain('enterprise app role is required');
	});

	it('rejects a whitespace-only enterprise app role', () => {
		const result = buildStaffRoleUpdateCommand(baseInput({ enterpriseAppRole: '   ' }), ['Staff.TechAdmin'], 'Staff.CaseManager');
		expect(result).toHaveProperty('errorMessage');
		expect((result as { errorMessage: string }).errorMessage).toContain('enterprise app role is required');
	});

	it("rejects updates when the caller cannot manage the target role's current enterprise app role", () => {
		const result = buildStaffRoleUpdateCommand(baseInput(), ['Staff.CaseManager'], 'Staff.TechAdmin');
		expect(result).toHaveProperty('errorMessage');
		expect((result as { errorMessage: string }).errorMessage).toContain('update a role of enterprise app role type: Staff.TechAdmin');
	});

	it('rejects updates when the requested enterprise app role is above the caller tier', () => {
		const result = buildStaffRoleUpdateCommand(baseInput({ enterpriseAppRole: 'Staff.TechAdmin' }), ['Staff.CaseManager'], 'Staff.CaseManager');
		expect(result).toHaveProperty('errorMessage');
		expect((result as { errorMessage: string }).errorMessage).toContain('update a role to enterprise app role type: Staff.TechAdmin');
	});

	it('builds the command with the trimmed enterprise app role when authorized for both tiers', () => {
		const result = buildStaffRoleUpdateCommand(baseInput({ enterpriseAppRole: ' Staff.CaseManager ' }), ['Staff.TechAdmin'], 'Staff.TechAdmin');
		expect(result).toStrictEqual({
			roleId: 'role-1',
			roleName: 'Renamed Role',
			enterpriseAppRole: 'Staff.CaseManager',
		});
	});

	it('allows updating a role that has no current enterprise app role', () => {
		const result = buildStaffRoleUpdateCommand(baseInput(), ['Staff.CaseManager'], undefined);
		expect(result).not.toHaveProperty('errorMessage');
	});
});

describe('staff-role.resolvers - staffRoleUpdate unit tests', () => {
	const invokeUpdate = async (ctx: GraphContext, input: StaffRoleUpdateInput) => {
		const Mutation = staffRoleResolvers.Mutation as NonNullable<typeof staffRoleResolvers.Mutation>;
		const staffRoleUpdate = Mutation.staffRoleUpdate as unknown as (parent: unknown, args: { input: StaffRoleUpdateInput }, context: GraphContext, info: GraphQLResolveInfo) => Promise<MutationResult>;
		return await staffRoleUpdate(null, { input }, ctx, {} as unknown as GraphQLResolveInfo);
	};

	const buildContext = (options: { callerRoles: string[]; existingRole: { id: string; enterpriseAppRole?: string } | null }) => {
		const update = vi.fn().mockResolvedValue({ id: 'role-1', roleName: 'Renamed Role' });
		const queryById = vi.fn().mockResolvedValue(options.existingRole);
		const ctx = {
			applicationServices: {
				verifiedUser: { verifiedJwt: { sub: 'actor-1', roles: options.callerRoles } },
				User: { StaffRole: { queryById, update } },
			},
		} as unknown as GraphContext;
		return { ctx, update, queryById };
	};

	it('rejects a blank enterprise app role without applying permission changes', async () => {
		const { ctx, update, queryById } = buildContext({
			callerRoles: ['Staff.CaseManager'],
			existingRole: { id: 'role-1', enterpriseAppRole: 'Staff.TechAdmin' },
		});

		const result = await invokeUpdate(ctx, baseInput({ enterpriseAppRole: '' }));

		expect(result.status.success).toBe(false);
		expect(result.status.errorMessage).toContain('enterprise app role is required');
		expect(queryById).toHaveBeenCalledWith({ roleId: 'role-1' });
		expect(update).not.toHaveBeenCalled();
	});

	it('rejects updates against a target role of a higher enterprise app role tier', async () => {
		const { ctx, update } = buildContext({
			callerRoles: ['Staff.CaseManager'],
			existingRole: { id: 'role-1', enterpriseAppRole: 'Staff.TechAdmin' },
		});

		const result = await invokeUpdate(ctx, baseInput());

		expect(result.status.success).toBe(false);
		expect(result.status.errorMessage).toContain('do not have permission to update a role of enterprise app role type: Staff.TechAdmin');
		expect(update).not.toHaveBeenCalled();
	});

	it('rejects updates when the target role does not exist', async () => {
		const { ctx, update } = buildContext({ callerRoles: ['Staff.TechAdmin'], existingRole: null });

		const result = await invokeUpdate(ctx, baseInput());

		expect(result.status.success).toBe(false);
		expect(result.status.errorMessage).toContain('not found');
		expect(update).not.toHaveBeenCalled();
	});

	it('updates the role when the caller is authorized for the current and requested tiers', async () => {
		const { ctx, update } = buildContext({
			callerRoles: ['Staff.TechAdmin'],
			existingRole: { id: 'role-1', enterpriseAppRole: 'Staff.CaseManager' },
		});

		const result = await invokeUpdate(ctx, baseInput());

		expect(result.status.success).toBe(true);
		expect(update).toHaveBeenCalledWith({
			roleId: 'role-1',
			roleName: 'Renamed Role',
			enterpriseAppRole: 'Staff.CaseManager',
		});
	});
});
