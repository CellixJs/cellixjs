import type { GraphQLResolveInfo } from 'graphql';
import { describe, expect, it, vi } from 'vitest';
import type { StaffUserMutationResult } from '../builder/generated.ts';
import type { GraphContext } from '../context.ts';
import staffUserResolvers from './staff-user.resolvers.ts';

describe('staff-user.resolvers - unit tests', () => {
	it('currentStaffUserAndCreateIfNotExists throws Unauthorized when no verifiedJwt', async () => {
		const ctx = { applicationServices: {} } as unknown as GraphContext;
		const Query = staffUserResolvers.Query as NonNullable<typeof staffUserResolvers.Query>;
		const currentStaffUserAndCreateIfNotExists = Query.currentStaffUserAndCreateIfNotExists as unknown as (parent: unknown, args: unknown, context: GraphContext, info: GraphQLResolveInfo) => Promise<unknown>;
		await expect(currentStaffUserAndCreateIfNotExists(null, null, ctx, {} as unknown as GraphQLResolveInfo)).rejects.toThrow('Unauthorized');
	});

	describe('staffUserAssignRole', () => {
		const buildContext = (options: { callerRoles: string[]; targetRole: { id: string; enterpriseAppRole?: string | null } | null; assignRole?: () => Promise<unknown> }) => {
			const queryById = vi.fn().mockResolvedValue(options.targetRole);
			const assignRole = vi.fn().mockImplementation(options.assignRole ?? (() => Promise.resolve({ id: 's1', displayName: 'Staff User' })));
			const ctx = {
				applicationServices: {
					verifiedUser: { verifiedJwt: { sub: 'actor-1', roles: options.callerRoles } },
					User: {
						StaffRole: { queryById },
						StaffUser: {
							queryByExternalId: () => Promise.resolve(null),
							assignRole,
						},
					},
				},
			} as unknown as GraphContext;
			return { ctx, queryById, assignRole };
		};

		const invokeAssign = async (ctx: GraphContext, roleId = 'r1') => {
			const Mutation = staffUserResolvers.Mutation as NonNullable<typeof staffUserResolvers.Mutation>;
			const staffUserAssignRoleFn = Mutation.staffUserAssignRole as unknown as (parent: unknown, args: { input: { staffUserId: string; roleId: string } }, context: GraphContext, info: GraphQLResolveInfo) => Promise<unknown>;
			return (await staffUserAssignRoleFn(null, { input: { staffUserId: 's1', roleId } }, ctx, {} as unknown as GraphQLResolveInfo)) as StaffUserMutationResult;
		};

		it('returns failure status when assignRole throws', async () => {
			const { ctx } = buildContext({
				callerRoles: ['Staff.CaseManager'],
				targetRole: { id: 'r1', enterpriseAppRole: 'Staff.CaseManager' },
				assignRole: () => Promise.reject(new Error('assign failed')),
			});
			const consoleErr = vi.spyOn(console, 'error').mockImplementation(() => {
				/* noop */
			});
			const res = await invokeAssign(ctx);
			expect(res.status.success).toBe(false);
			expect(res.status.errorMessage).toBe('assign failed');
			expect(consoleErr).toHaveBeenCalled();
			consoleErr.mockRestore();
		});

		it('rejects when the target role does not exist for non-tech-admin callers', async () => {
			const { ctx, assignRole } = buildContext({ callerRoles: ['Staff.CaseManager'], targetRole: null });
			const res = await invokeAssign(ctx, 'missing-role');
			expect(res.status.success).toBe(false);
			expect(res.status.errorMessage).toBe('Staff role not found');
			expect(assignRole).not.toHaveBeenCalled();
		});

		it('rejects assigning an unclassified role for non-tech-admin callers', async () => {
			const { ctx, assignRole } = buildContext({ callerRoles: ['Staff.CaseManager'], targetRole: { id: 'r1', enterpriseAppRole: '' } });
			const res = await invokeAssign(ctx);
			expect(res.status.success).toBe(false);
			expect(res.status.errorMessage).toContain('assign a role without an enterprise app role type');
			expect(assignRole).not.toHaveBeenCalled();
		});

		it('treats a whitespace-only enterprise app role as unclassified', async () => {
			const { ctx, assignRole } = buildContext({ callerRoles: ['Staff.CaseManager'], targetRole: { id: 'r1', enterpriseAppRole: '   ' } });
			const res = await invokeAssign(ctx);
			expect(res.status.success).toBe(false);
			expect(res.status.errorMessage).toContain('assign a role without an enterprise app role type');
			expect(assignRole).not.toHaveBeenCalled();
		});

		it('rejects assigning a role above the caller tier', async () => {
			const { ctx, assignRole } = buildContext({ callerRoles: ['Staff.CaseManager'], targetRole: { id: 'r1', enterpriseAppRole: 'Staff.TechAdmin' } });
			const res = await invokeAssign(ctx);
			expect(res.status.success).toBe(false);
			expect(res.status.errorMessage).toContain('assign a role with enterprise app role type: Staff.TechAdmin');
			expect(assignRole).not.toHaveBeenCalled();
		});

		it('assigns an allowed role for non-tech-admin callers', async () => {
			const { ctx, queryById, assignRole } = buildContext({ callerRoles: ['Staff.CaseManager'], targetRole: { id: 'r1', enterpriseAppRole: 'Staff.CaseManager' } });
			const res = await invokeAssign(ctx);
			expect(res.status.success).toBe(true);
			expect(queryById).toHaveBeenCalledWith({ roleId: 'r1' });
			expect(assignRole).toHaveBeenCalled();
		});

		it('lets a tech admin assign an unclassified role without a target lookup', async () => {
			const { ctx, queryById, assignRole } = buildContext({ callerRoles: ['Staff.TechAdmin'], targetRole: null });
			const res = await invokeAssign(ctx);
			expect(res.status.success).toBe(true);
			expect(queryById).not.toHaveBeenCalled();
			expect(assignRole).toHaveBeenCalled();
		});
	});
});
