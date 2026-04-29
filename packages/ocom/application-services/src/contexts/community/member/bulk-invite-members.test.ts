import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import type { Domain } from '@ocom/domain';
import type { DataSources } from '@ocom/persistence';
import { expect, vi } from 'vitest';
import { bulkInviteMembers } from './member-management.ts';

const test = { for: describeFeature };
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feature = await loadFeature(path.resolve(__dirname, 'features/bulk-invite-members.feature'));

function makeMockInvitation(email = 'invite@example.com'): Domain.Contexts.Community.Member.MemberInvitationEntityReference {
	return {
		id: `inv-${email}`,
		communityId: 'comm-1',
		email,
		message: '',
		status: 'PENDING',
		expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
		invitedBy: { id: 'user-id-1' } as Domain.Contexts.User.EndUser.EndUserEntityReference,
		acceptedBy: undefined,
		createdAt: new Date(),
		updatedAt: new Date(),
		schemaVersion: '1.0.0',
	} as Domain.Contexts.Community.Member.MemberInvitationEntityReference;
}

function makeDataSources(
	endUser: Domain.Contexts.User.EndUser.EndUserEntityReference | null = {
		id: 'user-id-1',
		externalId: 'user-ext-1',
	} as Domain.Contexts.User.EndUser.EndUserEntityReference,
): DataSources {
	return {
		readonlyDataSource: {
			User: {
				EndUser: {
					EndUserReadRepo: {
						getByExternalId: vi.fn().mockResolvedValue(endUser),
					},
				},
			},
		},
		domainDataSource: {
			Community: {
				Member: {
					MemberInvitationUnitOfWork: {
						withScopedTransaction: vi.fn(),
					},
				},
			},
		},
	} as unknown as DataSources;
}

function setupSuccessfulUoW(dataSources: DataSources, invitations: string[]): void {
	let _callCount = 0;
	const invitationMocks = invitations.map((email) => makeMockInvitation(email));

	vi.mocked(dataSources.domainDataSource.Community.Member.MemberInvitationUnitOfWork.withScopedTransaction).mockImplementation(async (callback) => {
		const mockRepo = {
			getNewInstance: vi.fn().mockImplementation((_communityId: string, email: string) => {
				return invitationMocks.find((inv) => inv.email === email) ?? makeMockInvitation(email);
			}),
			save: vi.fn().mockImplementation((inv: unknown) => {
				_callCount++;
				return inv;
			}),
		} as unknown as Domain.Contexts.Community.Member.MemberInvitationRepository<Domain.Contexts.Community.Member.MemberInvitationProps>;
		await callback(mockRepo);
	});
}

test.for(feature, ({ Scenario, BeforeEachScenario }) => {
	let dataSources: DataSources;
	let doBulkInvite: ReturnType<typeof bulkInviteMembers>;
	let results: Domain.Contexts.Community.Member.MemberInvitationEntityReference[];
	let thrownError: Error | undefined;

	BeforeEachScenario(() => {
		dataSources = makeDataSources();
		doBulkInvite = bulkInviteMembers(dataSources);
		results = [];
		thrownError = undefined;
	});

	Scenario('Bulk inviting multiple members successfully', ({ Given, And, When, Then }) => {
		Given('the inviting user with externalId "user-ext-1" exists', () => {
			/* empty */
		});

		And('the MemberInvitationUnitOfWork can save invitations', () => {
			setupSuccessfulUoW(dataSources, ['a@example.com', 'b@example.com']);
			doBulkInvite = bulkInviteMembers(dataSources);
		});

		When('I call bulkInviteMembers with communityId "comm-1", 2 invitations, and invitedByExternalId "user-ext-1"', async () => {
			results = await doBulkInvite({
				communityId: 'comm-1',
				invitations: [{ email: 'a@example.com' }, { email: 'b@example.com' }],
				invitedByExternalId: 'user-ext-1',
			});
		});

		Then('it should return 2 invitation entity references', () => {
			expect(results).toHaveLength(2);
		});

		And('getNewInstance should be called twice', () => {
			const uowMock = vi.mocked(dataSources.domainDataSource.Community.Member.MemberInvitationUnitOfWork.withScopedTransaction);
			expect(uowMock).toHaveBeenCalledTimes(1);
		});
	});

	Scenario('Bulk inviting with default expiry', ({ Given, And, When, Then }) => {
		let capturedExpiresAt: Date | undefined;

		Given('the inviting user with externalId "user-ext-1" exists', () => {
			/* empty */
		});

		And('the MemberInvitationUnitOfWork can save invitations', () => {
			vi.mocked(dataSources.domainDataSource.Community.Member.MemberInvitationUnitOfWork.withScopedTransaction).mockImplementation(async (callback) => {
				const mockRepo = {
					getNewInstance: vi.fn().mockImplementation((_comm: string, _email: string, _msg: string, expiresAt: Date) => {
						capturedExpiresAt = expiresAt;
						return makeMockInvitation();
					}),
					save: vi.fn().mockImplementation((inv: unknown) => inv),
				} as unknown as Domain.Contexts.Community.Member.MemberInvitationRepository<Domain.Contexts.Community.Member.MemberInvitationProps>;
				await callback(mockRepo);
			});
			doBulkInvite = bulkInviteMembers(dataSources);
		});

		When('I call bulkInviteMembers without specifying expiresInDays', async () => {
			await doBulkInvite({
				communityId: 'comm-1',
				invitations: [{ email: 'a@example.com' }],
				invitedByExternalId: 'user-ext-1',
			});
		});

		Then('getNewInstance should be called with an expiresAt 7 days from now', () => {
			const expectedDate = new Date();
			expectedDate.setDate(expectedDate.getDate() + 7);
			expect(capturedExpiresAt?.getDate()).toBe(expectedDate.getDate());
		});
	});

	Scenario('Bulk inviting with custom expiry', ({ Given, And, When, Then }) => {
		let capturedExpiresAt: Date | undefined;

		Given('the inviting user with externalId "user-ext-1" exists', () => {
			/* empty */
		});

		And('the MemberInvitationUnitOfWork can save invitations', () => {
			vi.mocked(dataSources.domainDataSource.Community.Member.MemberInvitationUnitOfWork.withScopedTransaction).mockImplementation(async (callback) => {
				const mockRepo = {
					getNewInstance: vi.fn().mockImplementation((_comm: string, _email: string, _msg: string, expiresAt: Date) => {
						capturedExpiresAt = expiresAt;
						return makeMockInvitation();
					}),
					save: vi.fn().mockImplementation((inv: unknown) => inv),
				} as unknown as Domain.Contexts.Community.Member.MemberInvitationRepository<Domain.Contexts.Community.Member.MemberInvitationProps>;
				await callback(mockRepo);
			});
			doBulkInvite = bulkInviteMembers(dataSources);
		});

		When('I call bulkInviteMembers with expiresInDays 30', async () => {
			await doBulkInvite({
				communityId: 'comm-1',
				invitations: [{ email: 'a@example.com' }],
				expiresInDays: 30,
				invitedByExternalId: 'user-ext-1',
			});
		});

		Then('getNewInstance should be called with an expiresAt 30 days from now', () => {
			const expectedDate = new Date();
			expectedDate.setDate(expectedDate.getDate() + 30);
			expect(capturedExpiresAt?.getDate()).toBe(expectedDate.getDate());
		});
	});

	Scenario('Bulk inviting when the inviting user is not found', ({ Given, When, Then }) => {
		Given('no user with externalId "unknown-user" exists', () => {
			dataSources = makeDataSources(null);
			doBulkInvite = bulkInviteMembers(dataSources);
		});

		When('I try to call bulkInviteMembers with invitedByExternalId "unknown-user"', async () => {
			try {
				await doBulkInvite({
					communityId: 'comm-1',
					invitations: [{ email: 'a@example.com' }],
					invitedByExternalId: 'unknown-user',
				});
			} catch (e) {
				thrownError = e as Error;
			}
		});

		Then('it should throw an error "Inviting user not found"', () => {
			expect(thrownError?.message).toBe('Inviting user not found');
		});
	});

	Scenario('Bulk inviting with partial failures', ({ Given, And, When, Then }) => {
		Given('the inviting user with externalId "user-ext-1" exists', () => {
			/* empty */
		});

		And('the MemberInvitationUnitOfWork fails for the second invitation but succeeds for the first', () => {
			let callCount = 0;
			vi.mocked(dataSources.domainDataSource.Community.Member.MemberInvitationUnitOfWork.withScopedTransaction).mockImplementation(async (callback) => {
				const mockRepo = {
					getNewInstance: vi.fn().mockImplementation((_comm: string, email: string) => {
						callCount++;
						if (callCount === 2) {
							throw new Error('Duplicate invitation');
						}
						return makeMockInvitation(email);
					}),
					save: vi.fn().mockImplementation((inv: unknown) => inv),
				} as unknown as Domain.Contexts.Community.Member.MemberInvitationRepository<Domain.Contexts.Community.Member.MemberInvitationProps>;
				await callback(mockRepo);
			});
			doBulkInvite = bulkInviteMembers(dataSources);
		});

		When('I call bulkInviteMembers with communityId "comm-1", 2 invitations, and invitedByExternalId "user-ext-1"', async () => {
			results = await doBulkInvite({
				communityId: 'comm-1',
				invitations: [{ email: 'a@example.com' }, { email: 'b@example.com' }],
				invitedByExternalId: 'user-ext-1',
			});
		});

		Then('it should return only 1 invitation entity reference', () => {
			expect(results).toHaveLength(1);
		});

		And('no error should be thrown', () => {
			expect(thrownError).toBeUndefined();
		});
	});

	Scenario('Bulk inviting with an empty list', ({ Given, And, When, Then }) => {
		Given('the inviting user with externalId "user-ext-1" exists', () => {
			/* empty */
		});

		And('the MemberInvitationUnitOfWork can save invitations', () => {
			setupSuccessfulUoW(dataSources, []);
			doBulkInvite = bulkInviteMembers(dataSources);
		});

		When('I call bulkInviteMembers with an empty invitations list', async () => {
			results = await doBulkInvite({
				communityId: 'comm-1',
				invitations: [],
				invitedByExternalId: 'user-ext-1',
			});
		});

		Then('it should return an empty array', () => {
			expect(results).toHaveLength(0);
		});
	});
});
