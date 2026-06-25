import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import type { EventBus } from '@cellix/domain-seedwork/event-bus';
import type { MemberInvitation, MemberInvitationModelType } from '@ocom/data-sources-mongoose-models/member/member-invitation';
import type { Domain } from '@ocom/domain';
import type { ClientSession } from 'mongoose';
import { expect, vi } from 'vitest';
import { MemberInvitationConverter, type MemberInvitationDomainAdapter } from './member-invitation.domain-adapter.ts';
import { MemberInvitationRepository } from './member-invitation.repository.ts';

const test = { for: describeFeature };
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feature = await loadFeature(path.resolve(__dirname, 'features/member-invitation.repository.feature'));

function makeMemberInvitationDoc(overrides: Partial<Omit<MemberInvitation, 'message'>> & { message?: string } = {}): MemberInvitation {
	const futureDate = new Date();
	futureDate.setDate(futureDate.getDate() + 7);
	return {
		id: '507f1f77bcf86cd799439011',
		communityId: 'comm-1',
		email: 'test@example.com',
		message: 'Hello',
		status: 'PENDING',
		expiresAt: futureDate,
		invitedBy: undefined,
		acceptedBy: undefined,
		createdAt: new Date('2024-01-01'),
		updatedAt: new Date('2024-01-02'),
		set(key: keyof MemberInvitation, value: unknown) {
			(this as MemberInvitation)[key] = value as never;
		},
		...overrides,
	} as unknown as MemberInvitation;
}

function makeMockPassport() {
	return {
		community: {
			forCommunity: vi.fn(() => ({
				determineIf: vi.fn(() => true),
			})),
		},
		user: {
			forEndUser: vi.fn(() => ({
				determineIf: vi.fn(() => true),
			})),
		},
	} as unknown as Domain.Passport;
}

test.for(feature, ({ Scenario, Background, BeforeEachScenario }) => {
	let repo: MemberInvitationRepository;
	let converter: MemberInvitationConverter;
	let passport: Domain.Passport;
	let invitationDoc: MemberInvitation;
	let result: Domain.Contexts.Community.Member.MemberInvitation<MemberInvitationDomainAdapter>;
	let results: Domain.Contexts.Community.Member.MemberInvitation<MemberInvitationDomainAdapter>[];
	let caughtError: Error | undefined;

	BeforeEachScenario(() => {
		invitationDoc = makeMemberInvitationDoc();
		converter = new MemberInvitationConverter();
		passport = makeMockPassport();
		result = {} as Domain.Contexts.Community.Member.MemberInvitation<MemberInvitationDomainAdapter>;
		results = [];
		caughtError = undefined;

		const ModelMock = function (this: MemberInvitation) {
			Object.assign(this, makeMemberInvitationDoc());
		};
		Object.assign(ModelMock, {
			findById: vi.fn((id: string) => ({
				exec: vi.fn(async () => (id === '507f1f77bcf86cd799439011' ? invitationDoc : null)),
			})),
			find: vi.fn((query: Record<string, string>) => ({
				exec: vi.fn(() => {
					if (query['communityId'] === 'empty-community') return [];
					return [invitationDoc];
				}),
			})),
		});

		const eventBus = { publish: vi.fn() } as unknown as EventBus;
		const session = { startTransaction: vi.fn(), endSession: vi.fn() } as unknown as ClientSession;

		repo = new MemberInvitationRepository(passport, ModelMock as unknown as MemberInvitationModelType, converter, eventBus, session);
	});

	Background(({ Given, And }) => {
		Given('a Mongoose MemberInvitation model with a valid document', () => {
			// Set up in BeforeEachScenario
		});
		And('a valid Passport for domain operations', () => {
			// Set up in BeforeEachScenario
		});
	});

	Scenario('Getting a MemberInvitation by id when it exists', ({ When, Then }) => {
		When('I call getById with a valid id', async () => {
			result = await repo.getById('507f1f77bcf86cd799439011');
		});

		Then('it should return the corresponding MemberInvitation domain object', () => {
			expect(result).toBeDefined();
			expect(result.email).toBe('test@example.com');
		});
	});

	Scenario('Getting a MemberInvitation by id when it does not exist', ({ When, Then }) => {
		When('I call getById with an id that does not exist', async () => {
			try {
				await repo.getById('non-existent-id');
			} catch (e) {
				caughtError = e as Error;
			}
		});

		Then('an error should be thrown indicating the invitation was not found', () => {
			expect(caughtError).toBeDefined();
			expect(caughtError?.message).toContain('non-existent-id');
		});
	});

	Scenario('Getting MemberInvitations by communityId', ({ When, Then }) => {
		When('I call getByCommunityId with communityId "comm-1"', async () => {
			results = await repo.getByCommunityId('comm-1');
		});

		Then('it should return a list of MemberInvitation domain objects for that community', () => {
			expect(Array.isArray(results)).toBe(true);
			expect(results.length).toBeGreaterThan(0);
			expect(results[0]?.email).toBe('test@example.com');
		});
	});

	Scenario('Getting MemberInvitations by communityId returns empty list when none found', ({ When, Then }) => {
		When('I call getByCommunityId with a communityId that has no invitations', async () => {
			results = await repo.getByCommunityId('empty-community');
		});

		Then('it should return an empty array', () => {
			expect(results).toHaveLength(0);
		});
	});

	Scenario('Creating a new MemberInvitation instance', ({ When, Then, And }) => {
		When('I call getNewInstance with communityId "comm-1", email "test@example.com", message "Hello", a future expiresAt, and invitedById "507f1f77bcf86cd799439011"', async () => {
			const expiresAt = new Date();
			expiresAt.setDate(expiresAt.getDate() + 7);
			result = await repo.getNewInstance('comm-1', 'test@example.com', 'Hello', expiresAt, '507f1f77bcf86cd799439011');
		});

		Then('it should return a new MemberInvitation domain object', () => {
			expect(result).toBeDefined();
		});

		And('the invitation email should be "test@example.com"', () => {
			expect(result.email).toBe('test@example.com');
		});

		And('the invitation communityId should be "comm-1"', () => {
			expect(result.communityId).toBe('comm-1');
		});

		And('the invitation status should be "PENDING"', () => {
			expect(result.status).toBe('PENDING');
		});
	});
});
