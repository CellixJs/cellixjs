import type { GraphQLResolveInfo } from 'graphql';
import { describe, expect, it, vi } from 'vitest';
import type { StaffUserMutationResult } from '../builder/generated.ts';
import type { GraphContext } from '../context.ts';
import staffUserResolvers from './staff-user.resolvers.ts';

describe('staff-user.resolvers - unit tests', () => {
	it('currentStaffUserAndCreateIfNotExists throws Unauthorized when no verifiedJwt', async () => {
		const ctx = { applicationServices: {} } as unknown as GraphContext;
		const Query = staffUserResolvers.Query as unknown as Record<string, (...args: unknown[]) => Promise<unknown>>;
		const currentStaffUserAndCreateIfNotExists = Query.currentStaffUserAndCreateIfNotExists as (...args: unknown[]) => Promise<unknown>;
		await expect(currentStaffUserAndCreateIfNotExists(null, null, ctx, {} as unknown as GraphQLResolveInfo)).rejects.toThrow('Unauthorized');
	});

	it('staffUserAssignRole returns failure status when assignRole throws', async () => {
		// assignRole will throw; resolver should catch and return a failure status
		const ctx = {
			applicationServices: {
				verifiedUser: { verifiedJwt: { sub: 'actor-1', roles: ['Staff.CaseManager'] } },
				User: {
					StaffRole: { list: async () => [{ id: 'r1', enterpriseAppRole: 'Staff.CaseManager' }] },
					StaffUser: {
						queryByExternalId: async () => null,
						assignRole: () => Promise.reject(new Error('assign failed')),
					},
				},
			},
		};

		const consoleErr = vi.spyOn(console, 'error').mockImplementation(() => {
			/* noop */
		});
		const Mutation = staffUserResolvers.Mutation as unknown as Record<string, (...args: unknown[]) => Promise<unknown>>;
		const staffUserAssignRoleFn = Mutation.staffUserAssignRole as (...args: unknown[]) => Promise<unknown>;
		const res = await staffUserAssignRoleFn(null, { input: { staffUserId: 's1', roleId: 'r1' } }, ctx, {} as unknown as GraphQLResolveInfo);
		const resTyped = res as StaffUserMutationResult;
		expect(resTyped).toBeDefined();
		expect(resTyped.status).toBeDefined();
		expect(resTyped.status.success).toBe(false);
		expect(resTyped.status.errorMessage).toBe('assign failed');
		expect(consoleErr).toHaveBeenCalled();
		consoleErr.mockRestore();
	});
});
