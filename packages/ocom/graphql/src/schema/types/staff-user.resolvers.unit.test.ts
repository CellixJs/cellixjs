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
		const buildContext = (options: { callerRoles: string[]; assignRole?: () => Promise<unknown> }) => {
			const assignRole = vi.fn().mockImplementation(options.assignRole ?? (() => Promise.resolve({ id: 's1', displayName: 'Staff User' })));
			const ctx = {
				applicationServices: {
					verifiedUser: { verifiedJwt: { sub: 'actor-1', roles: options.callerRoles } },
					User: {
						StaffUser: {
							queryByExternalId: () => Promise.resolve(null),
							assignRole,
						},
					},
				},
			} as unknown as GraphContext;
			return { ctx, assignRole };
		};

		const invokeAssign = async (ctx: GraphContext, roleId = 'r1') => {
			const Mutation = staffUserResolvers.Mutation as NonNullable<typeof staffUserResolvers.Mutation>;
			const staffUserAssignRoleFn = Mutation.staffUserAssignRole as unknown as (parent: unknown, args: { input: { staffUserId: string; roleId: string } }, context: GraphContext, info: GraphQLResolveInfo) => Promise<unknown>;
			return (await staffUserAssignRoleFn(null, { input: { staffUserId: 's1', roleId } }, ctx, {} as unknown as GraphQLResolveInfo)) as StaffUserMutationResult;
		};

		const silenceConsoleError = () =>
			vi.spyOn(console, 'error').mockImplementation(() => {
				/* noop */
			});

		it('returns failure status when assignRole throws', async () => {
			const { ctx } = buildContext({
				callerRoles: ['Staff.CaseManager'],
				assignRole: () => Promise.reject(new Error('assign failed')),
			});
			const consoleErr = silenceConsoleError();
			const res = await invokeAssign(ctx);
			expect(res.status.success).toBe(false);
			expect(res.status.errorMessage).toBe('assign failed');
			expect(consoleErr).toHaveBeenCalled();
			consoleErr.mockRestore();
		});

		it('propagates the transactional tier rejection from the application service', async () => {
			const { ctx } = buildContext({
				callerRoles: ['Staff.CaseManager'],
				assignRole: () => Promise.reject(new Error('You do not have permission to assign a role with enterprise app role type: Staff.TechAdmin')),
			});
			const consoleErr = silenceConsoleError();
			const res = await invokeAssign(ctx);
			expect(res.status.success).toBe(false);
			expect(res.status.errorMessage).toContain('assign a role with enterprise app role type: Staff.TechAdmin');
			consoleErr.mockRestore();
		});

		it('passes a restricted caller context for non-tech-admin callers', async () => {
			const { ctx, assignRole } = buildContext({ callerRoles: ['Staff.CaseManager'] });
			const res = await invokeAssign(ctx);
			expect(res.status.success).toBe(true);
			expect(assignRole).toHaveBeenCalledWith({
				staffUserId: 's1',
				roleId: 'r1',
				actorStaffUserId: 'actor-1',
				callerContext: {
					allowedEnterpriseAppRoles: ['Staff.CaseManager'],
					canAssignAnyRole: false,
				},
			});
		});

		it('marks a tech admin as able to assign any role', async () => {
			const { ctx, assignRole } = buildContext({ callerRoles: ['Staff.TechAdmin'] });
			const res = await invokeAssign(ctx);
			expect(res.status.success).toBe(true);
			expect(assignRole).toHaveBeenCalledWith(
				expect.objectContaining({
					callerContext: {
						allowedEnterpriseAppRoles: ['Staff.CaseManager', 'Staff.ServiceLineOwner', 'Staff.Finance', 'Staff.TechAdmin'],
						canAssignAnyRole: true,
					},
				}),
			);
		});

		it('unions allowed tiers across the caller enterprise app roles', async () => {
			const { ctx, assignRole } = buildContext({ callerRoles: ['Staff.ServiceLineOwner', 'Staff.Finance'] });
			const res = await invokeAssign(ctx);
			expect(res.status.success).toBe(true);
			expect(assignRole).toHaveBeenCalledWith(
				expect.objectContaining({
					callerContext: {
						allowedEnterpriseAppRoles: ['Staff.ServiceLineOwner', 'Staff.CaseManager', 'Staff.Finance'],
						canAssignAnyRole: false,
					},
				}),
			);
		});
	});
});
