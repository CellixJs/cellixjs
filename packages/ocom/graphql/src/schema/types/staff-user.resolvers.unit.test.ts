import { describe, it, expect, vi } from 'vitest';
import staffUserResolvers from './staff-user.resolvers.ts';

describe('staff-user.resolvers - unit tests', () => {
	it('currentStaffUserAndCreateIfNotExists throws Unauthorized when no verifiedJwt', async () => {
		const ctx: any = { applicationServices: {} };
		await expect((staffUserResolvers.Query as any).currentStaffUserAndCreateIfNotExists(null, null, ctx, {} as any)).rejects.toThrow('Unauthorized');
	});

	it('staffUserAssignRole returns failure status when assignRole throws', async () => {
		// assignRole will throw; resolver should catch and return a failure status
		const ctx: any = {
			applicationServices: {
				verifiedUser: { verifiedJwt: { sub: 'actor-1', roles: ['Staff.CaseManager'] } },
				User: {
					StaffRole: { list: async () => [{ id: 'r1', enterpriseAppRole: 'Staff.CaseManager' }] },
					StaffUser: {
						queryByExternalId: async () => null,
						assignRole: async () => { throw new Error('assign failed'); },
					},
				},
			},
		};

		const consoleErr = vi.spyOn(console, 'error').mockImplementation(() => {});
		const res = await (staffUserResolvers.Mutation as any).staffUserAssignRole(null, { input: { staffUserId: 's1', roleId: 'r1' } }, ctx, {} as any);
		expect(res).toBeDefined();
		expect(res.status).toBeDefined();
		expect(res.status.success).toBe(false);
		expect(res.status.errorMessage).toBe('assign failed');
		expect(consoleErr).toHaveBeenCalled();
		consoleErr.mockRestore();
	});
});
