import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import type { GraphQLResolveInfo } from 'graphql';
import { expect, vi } from 'vitest';
import type { MutationStaffRoleDeleteArgs, RequireFields } from '../builder/generated.ts';
import type { GraphContext } from '../context.ts';
import staffRoleResolvers from './staff-role.resolvers.ts';

const test = { for: describeFeature };
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feature = await loadFeature(path.resolve(__dirname, 'features/staff-role.resolvers.feature'));

type StaffRoleDeleteResolver = (parent: unknown, args: RequireFields<MutationStaffRoleDeleteArgs, 'input'>, context: GraphContext, info: GraphQLResolveInfo) => Promise<{ status: { success: boolean; errorMessage?: string } }>;

function makeMockGraphContext(verified: boolean): GraphContext {
	return {
		applicationServices: {
			User: {
				StaffRole: {
					delete: vi.fn(),
				},
				StaffUser: {
					queryByExternalId: vi.fn().mockResolvedValue({ id: 'actor-staff-user-id' }),
				},
			},
			...(verified
				? {
						verifiedUser: {
							verifiedJwt: {
								sub: 'staff-user-sub',
								roles: ['Staff.TechAdmin'],
							},
						},
					}
				: {}),
		},
	} as unknown as GraphContext;
}

test.for(feature, ({ Scenario, BeforeEachScenario }) => {
	let context: GraphContext;
	let result: { status: { success: boolean; errorMessage?: string } };

	const executeDelete = async (roleId: string) => {
		const resolver = staffRoleResolvers.Mutation?.staffRoleDelete as unknown as StaffRoleDeleteResolver;
		result = await resolver(null, { input: { id: roleId } }, context, {} as GraphQLResolveInfo);
	};

	BeforeEachScenario(() => {
		vi.clearAllMocks();
		context = makeMockGraphContext(true);
	});

	Scenario('Deleting a staff role successfully', ({ Given, When, Then, And }) => {
		Given('a staff user with a verified JWT', () => {
			context = makeMockGraphContext(true);
		});

		When('the staffRoleDelete mutation is executed for role "607f1f77bcf86cd799439099"', async () => {
			vi.mocked(context.applicationServices.User.StaffRole.delete).mockResolvedValue(undefined);
			await executeDelete('607f1f77bcf86cd799439099');
		});

		Then('it should call User.StaffRole.delete with the role id and actor id', () => {
			expect(context.applicationServices.User.StaffUser.queryByExternalId).toHaveBeenCalledWith({
				externalId: 'staff-user-sub',
			});
			expect(context.applicationServices.User.StaffRole.delete).toHaveBeenCalledWith({
				roleId: '607f1f77bcf86cd799439099',
				actorStaffUserId: 'actor-staff-user-id',
			});
		});

		And('it should return a success status', () => {
			expect(result.status.success).toBe(true);
		});
	});

	Scenario('Current staff user cannot be resolved for deletion', ({ Given, And, When, Then }) => {
		Given('a staff user with a verified JWT', () => {
			context = makeMockGraphContext(true);
		});
		And('the current staff user cannot be resolved', () => {
			vi.mocked(context.applicationServices.User.StaffUser.queryByExternalId).mockResolvedValue(null);
		});
		When('the staffRoleDelete mutation is executed for role "607f1f77bcf86cd799439099"', async () => {
			await executeDelete('607f1f77bcf86cd799439099');
		});
		Then('it should return a current staff user failure status', () => {
			expect(result.status.success).toBe(false);
			expect(result.status.errorMessage).toBe('Current staff user not found');
		});
		And('it should not call User.StaffRole.delete', () => {
			expect(context.applicationServices.User.StaffRole.delete).not.toHaveBeenCalled();
		});
	});

	Scenario('Unauthorized staff role deletion', ({ Given, When, Then, And }) => {
		Given('a request without a verified JWT', () => {
			context = makeMockGraphContext(false);
		});

		When('the staffRoleDelete mutation is executed without authentication', async () => {
			await executeDelete('607f1f77bcf86cd799439099');
		});

		Then('it should return an unauthorized failure status', () => {
			expect(result.status.success).toBe(false);
			expect(result.status.errorMessage).toBe('Unauthorized');
		});

		And('it should not call User.StaffRole.delete', () => {
			expect(context.applicationServices.User.StaffRole.delete).not.toHaveBeenCalled();
		});
	});

	Scenario('Staff role deletion error handling', ({ Given, And, When, Then }) => {
		Given('a staff user with a verified JWT', () => {
			context = makeMockGraphContext(true);
		});

		And('the delete application service rejects with "You do not have permission to delete this role"', () => {
			vi.mocked(context.applicationServices.User.StaffRole.delete).mockRejectedValue(new Error('You do not have permission to delete this role'));
		});

		When('the staffRoleDelete mutation is executed for role "607f1f77bcf86cd799439099"', async () => {
			await executeDelete('607f1f77bcf86cd799439099');
		});

		Then('it should return a failure status with the error message', () => {
			expect(result.status.success).toBe(false);
			expect(result.status.errorMessage).toBe('You do not have permission to delete this role');
		});
	});
});
