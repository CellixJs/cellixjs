import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import type { Domain } from '@ocom/domain';
import type { DataSources } from '@ocom/persistence';
import { expect, vi } from 'vitest';
import { inviteMember } from './member-management.ts';

const test = { for: describeFeature };
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feature = await loadFeature(path.resolve(__dirname, 'features/invite-member.feature'));

function makeMockInvitation(overrides: Partial<Domain.Contexts.Community.Member.MemberInvitationEntityReference> = {}): Domain.Contexts.Community.Member.MemberInvitationEntityReference {
	return {
		id: '507f1f77bcf86cd799439011',
		communityId: 'comm-1',
		email: 'invite@example.com',
		message: '',
		status: 'PENDING',
		expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
		invitedBy: { id: 'user-id-1' } as Domain.Contexts.User.EndUser.EndUserEntityReference,
		acceptedBy: undefined,
		createdAt: new Date(),
		updatedAt: new Date(),
		schemaVersion: '1.0.0',
		...overrides,
	} as Domain.Contexts.Community.Member.MemberInvitationEntityReference;
}

function makeMockEndUser(overrides: Partial<Domain.Contexts.User.EndUser.EndUserEntityReference> = {}): Domain.Contexts.User.EndUser.EndUserEntityReference {
	return {
		id: 'user-id-1',
		externalId: 'user-ext-1',
		...overrides,
	} as Domain.Contexts.User.EndUser.EndUserEntityReference;
}

function makeMockRepo() {
	return {
		getNewInstance: vi.fn(),
		save: vi.fn(),
	} as unknown as Domain.Contexts.Community.Member.MemberInvitationRepository<Domain.Contexts.Community.Member.MemberInvitationProps>;
}

function makeDataSources(endUser: Domain.Contexts.User.EndUser.EndUserEntityReference | null = makeMockEndUser()): DataSources {
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

test.for(feature, ({ Scenario, BeforeEachScenario }) => {
	let dataSources: DataSources;
	let doInviteMember: ReturnType<typeof inviteMember>;
	let result: Domain.Contexts.Community.Member.MemberInvitationEntityReference;
	let thrownError: Error | undefined;

	BeforeEachScenario(() => {
		dataSources = makeDataSources();
		doInviteMember = inviteMember(dataSources);
		thrownError = undefined;
	});

	Scenario('Inviting a member successfully with default expiry', ({ Given, And, When, Then }) => {
		const mockInvitation = makeMockInvitation();
		let mockRepo: ReturnType<typeof makeMockRepo>;

		Given('the inviting user with externalId "user-ext-1" exists', () => {
			// makeDataSources already sets up the mock
		});

		And('the MemberInvitationUnitOfWork can save an invitation', () => {
			mockRepo = makeMockRepo();
			vi.mocked(mockRepo.getNewInstance).mockResolvedValue(mockInvitation as unknown as Domain.Contexts.Community.Member.MemberInvitation<Domain.Contexts.Community.Member.MemberInvitationProps>);
			vi.mocked(mockRepo.save).mockResolvedValue(mockInvitation as unknown as Domain.Contexts.Community.Member.MemberInvitation<Domain.Contexts.Community.Member.MemberInvitationProps>);

			vi.mocked(dataSources.domainDataSource.Community.Member.MemberInvitationUnitOfWork.withScopedTransaction).mockImplementation(async (callback) => {
				await callback(mockRepo);
			});
			doInviteMember = inviteMember(dataSources);
		});

		When('I call inviteMember with communityId "comm-1", email "invite@example.com", and invitedByExternalId "user-ext-1"', async () => {
			result = await doInviteMember({
				communityId: 'comm-1',
				email: 'invite@example.com',
				invitedByExternalId: 'user-ext-1',
			});
		});

		Then('it should call getNewInstance with communityId "comm-1", email "invite@example.com", an empty message, and an expiresAt 7 days from now', () => {
			expect(mockRepo.getNewInstance).toHaveBeenCalledWith('comm-1', 'invite@example.com', '', expect.any(Date), 'user-id-1');
			const callArgs = vi.mocked(mockRepo.getNewInstance).mock.calls[0];
			const expiresAt = callArgs?.[3] as Date;
			const expectedDate = new Date();
			expectedDate.setDate(expectedDate.getDate() + 7);
			expect(expiresAt.getDate()).toBe(expectedDate.getDate());
		});

		And('it should save the new invitation', () => {
			expect(mockRepo.save).toHaveBeenCalledWith(mockInvitation);
		});

		And('it should return the saved invitation entity reference', () => {
			expect(result).toBe(mockInvitation);
		});
	});

	Scenario('Inviting a member with custom expiry days', ({ Given, And, When, Then }) => {
		const mockInvitation = makeMockInvitation();
		let mockRepo: ReturnType<typeof makeMockRepo>;

		Given('the inviting user with externalId "user-ext-1" exists', () => {
			/* empty */
		});

		And('the MemberInvitationUnitOfWork can save an invitation', () => {
			mockRepo = makeMockRepo();
			vi.mocked(mockRepo.getNewInstance).mockResolvedValue(mockInvitation as unknown as Domain.Contexts.Community.Member.MemberInvitation<Domain.Contexts.Community.Member.MemberInvitationProps>);
			vi.mocked(mockRepo.save).mockResolvedValue(mockInvitation as unknown as Domain.Contexts.Community.Member.MemberInvitation<Domain.Contexts.Community.Member.MemberInvitationProps>);
			vi.mocked(dataSources.domainDataSource.Community.Member.MemberInvitationUnitOfWork.withScopedTransaction).mockImplementation(async (callback) => {
				await callback(mockRepo);
			});
			doInviteMember = inviteMember(dataSources);
		});

		When('I call inviteMember with communityId "comm-1", email "invite@example.com", expiresInDays 14, and invitedByExternalId "user-ext-1"', async () => {
			result = await doInviteMember({
				communityId: 'comm-1',
				email: 'invite@example.com',
				expiresInDays: 14,
				invitedByExternalId: 'user-ext-1',
			});
		});

		Then('it should call getNewInstance with an expiresAt 14 days from now', () => {
			const callArgs = vi.mocked(mockRepo.getNewInstance).mock.calls[0];
			const expiresAt = callArgs?.[3] as Date;
			const expectedDate = new Date();
			expectedDate.setDate(expectedDate.getDate() + 14);
			expect(expiresAt.getDate()).toBe(expectedDate.getDate());
		});

		And('it should return the saved invitation entity reference', () => {
			expect(result).toBe(mockInvitation);
		});
	});

	Scenario('Inviting a member with a custom message', ({ Given, And, When, Then }) => {
		const mockInvitation = makeMockInvitation({ message: 'Join us!' });
		let mockRepo: ReturnType<typeof makeMockRepo>;

		Given('the inviting user with externalId "user-ext-1" exists', () => {
			/* empty */
		});

		And('the MemberInvitationUnitOfWork can save an invitation', () => {
			mockRepo = makeMockRepo();
			vi.mocked(mockRepo.getNewInstance).mockResolvedValue(mockInvitation as unknown as Domain.Contexts.Community.Member.MemberInvitation<Domain.Contexts.Community.Member.MemberInvitationProps>);
			vi.mocked(mockRepo.save).mockResolvedValue(mockInvitation as unknown as Domain.Contexts.Community.Member.MemberInvitation<Domain.Contexts.Community.Member.MemberInvitationProps>);
			vi.mocked(dataSources.domainDataSource.Community.Member.MemberInvitationUnitOfWork.withScopedTransaction).mockImplementation(async (callback) => {
				await callback(mockRepo);
			});
			doInviteMember = inviteMember(dataSources);
		});

		When('I call inviteMember with communityId "comm-1", email "invite@example.com", message "Join us!", and invitedByExternalId "user-ext-1"', async () => {
			result = await doInviteMember({
				communityId: 'comm-1',
				email: 'invite@example.com',
				message: 'Join us!',
				invitedByExternalId: 'user-ext-1',
			});
		});

		Then('getNewInstance should be called with message "Join us!"', () => {
			expect(mockRepo.getNewInstance).toHaveBeenCalledWith('comm-1', 'invite@example.com', 'Join us!', expect.any(Date), 'user-id-1');
		});

		And('it should return the saved invitation entity reference', () => {
			expect(result).toBe(mockInvitation);
		});
	});

	Scenario('Inviting a member when the inviting user is not found', ({ Given, When, Then }) => {
		Given('no user with externalId "unknown-user" exists', () => {
			dataSources = makeDataSources(null);
			doInviteMember = inviteMember(dataSources);
		});

		When('I try to call inviteMember with invitedByExternalId "unknown-user"', async () => {
			try {
				await doInviteMember({
					communityId: 'comm-1',
					email: 'invite@example.com',
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

	Scenario('Inviting a member when save fails', ({ Given, And, When, Then }) => {
		Given('the inviting user with externalId "user-ext-1" exists', () => {
			/* empty */
		});

		And('the MemberInvitationUnitOfWork throws during the transaction', () => {
			vi.mocked(dataSources.domainDataSource.Community.Member.MemberInvitationUnitOfWork.withScopedTransaction).mockImplementation(async (callback) => {
				// callback runs but invitation is never set (simulates save not completing)
				const mockRepo = makeMockRepo();
				vi.mocked(mockRepo.getNewInstance).mockResolvedValue({} as Domain.Contexts.Community.Member.MemberInvitation<Domain.Contexts.Community.Member.MemberInvitationProps>);
				vi.mocked(mockRepo.save).mockResolvedValue(undefined as unknown as Domain.Contexts.Community.Member.MemberInvitation<Domain.Contexts.Community.Member.MemberInvitationProps>);
				await callback(mockRepo);
			});
			doInviteMember = inviteMember(dataSources);
		});

		When('I try to call inviteMember with communityId "comm-1", email "invite@example.com", and invitedByExternalId "user-ext-1"', async () => {
			try {
				await doInviteMember({
					communityId: 'comm-1',
					email: 'invite@example.com',
					invitedByExternalId: 'user-ext-1',
				});
			} catch (e) {
				thrownError = e as Error;
			}
		});

		Then('it should throw an error "Unable to create member invitation"', () => {
			expect(thrownError?.message).toBe('Unable to create member invitation');
		});
	});
});
