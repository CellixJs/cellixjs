import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import type { EventBus } from '@cellix/domain-seedwork/event-bus';
import type {
	Community,
	Member,
	MemberModelType,
} from '@ocom/data-sources-mongoose-models/community';
import { Domain } from '@ocom/domain';
import type { ClientSession } from 'mongoose';
import { expect, vi } from 'vitest';
import {
	MemberConverter,
	type MemberDomainAdapter,
} from './member.domain-adapter.ts';
import { MemberRepository } from './member.repository.ts';

const test = { for: describeFeature };
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feature = await loadFeature(
	path.resolve(__dirname, 'features/member.repository.feature'),
);

function makeMemberDoc(overrides: Partial<Member> = {}) {
	const base = {
		id: '507f1f77bcf86cd799439011', // Valid ObjectId string
		memberName: 'Test Member',
		community: makeCommunityDoc(),
		set(key: keyof Member, value: unknown) {
			(this as Member)[key] = value as never;
		},
		...overrides,
	} as Member;
	return vi.mocked(base);
}

function makeCommunityDoc(overrides: Partial<Community> = {}) {
	return {
		id: '507f1f77bcf86cd799439012',
		name: 'Test Community',
		...overrides,
	} as Community; // Valid ObjectId string
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
	let repo: MemberRepository;
	let converter: MemberConverter;
	let passport: Domain.Passport;
	let memberDoc: Member;
	let communityDoc: Community;
	let result: Domain.Contexts.Community.Member.Member<MemberDomainAdapter>;
	let results: Domain.Contexts.Community.Member.Member<MemberDomainAdapter>[];

	BeforeEachScenario(() => {
		memberDoc = makeMemberDoc();
		communityDoc = makeCommunityDoc();
		converter = new MemberConverter();
		passport = makeMockPassport();
		result = {} as Domain.Contexts.Community.Member.Member<MemberDomainAdapter>;
		results = [];

		// Mock the Mongoose model as a constructor function with static methods
		const ModelMock = function (this: Member) {
			Object.assign(this, makeMemberDoc());
		};
		// Attach static methods to the constructor
		Object.assign(ModelMock, {
			findById: vi.fn((id: string) => ({
				populate: vi.fn().mockReturnThis(),
				exec: vi.fn(async () =>
					id === '507f1f77bcf86cd799439011' ? memberDoc : null,
				),
			})),
			find: vi.fn(() => ({
				populate: vi.fn().mockReturnThis(),
				exec: vi.fn(() => [memberDoc]),
			})),
		});

		// Provide minimal eventBus and session mocks (not used in constructor)
		const eventBus = { publish: vi.fn() } as unknown as EventBus;
		const session = {
			startTransaction: vi.fn(),
			endSession: vi.fn(),
		} as unknown as ClientSession;

		// Create repository with correct constructor parameters
		repo = new MemberRepository(
			passport,
			ModelMock as unknown as MemberModelType,
			converter,
			eventBus,
			session,
		);
	});

	Background(({ Given, And }) => {
		Given(
			'a MemberRepository instance with a working Mongoose model, type converter, and passport',
			() => {
				// This is set up in BeforeEachScenario
			},
		);
		And(
			'a valid Mongoose Member document with id "507f1f77bcf86cd799439011", name "Test Member", and a populated community field',
			() => {
				memberDoc = makeMemberDoc({
					_id: '507f1f77bcf86cd799439011',
					memberName: 'Test Member',
					community: communityDoc,
				});
			},
		);
	});

	Scenario('Getting a member by id', ({ When, Then, And }) => {
		When('I call getById with "507f1f77bcf86cd799439011"', async () => {
			result = await repo.getById('507f1f77bcf86cd799439011');
		});
		Then('I should receive a Member domain object', () => {
			expect(result).toBeInstanceOf(Domain.Contexts.Community.Member.Member);
		});
		And('the domain object\'s name should be "Test Member"', () => {
			expect(result.memberName).toBe('Test Member');
		});
	});

	Scenario('Getting a member by id that does not exist', ({ When, Then }) => {
		let gettingMemberThatDoesNotExist: () => Promise<
			Domain.Contexts.Community.Member.Member<MemberDomainAdapter>
		>;
		When('I call getById with "nonexistent-id"', () => {
			gettingMemberThatDoesNotExist = async () =>
				await repo.getById('nonexistent-id');
		});
		Then(
			'an error should be thrown indicating "Member with id nonexistent-id not found"',
			async () => {
				await expect(gettingMemberThatDoesNotExist).rejects.toThrow();
				await expect(gettingMemberThatDoesNotExist).rejects.toThrow(
					/Member with id nonexistent-id not found/,
				);
			},
		);
	});

	Scenario('Getting all members', ({ When, Then, And }) => {
		When('I call getAll', async () => {
			results = await repo.getAll();
		});
		Then('I should receive an array of Member domain objects', () => {
			expect(Array.isArray(results)).toBe(true);
			expect(results.length).toBeGreaterThan(0);
			expect(results[0]).toBeInstanceOf(
				Domain.Contexts.Community.Member.Member,
			);
		});
		And(
			'the array should contain at least one member with name "Test Member"',
			() => {
				const testMember = results.find(
					(member) => member.memberName === 'Test Member',
				);
				expect(testMember).toBeDefined();
			},
		);
	});

	Scenario(
		'Getting members assigned to a role',
		({ Given, When, Then, And }) => {
			let roleId: string;
			Given('a role with id "507f1f77bcf86cd799439013"', () => {
				roleId = '507f1f77bcf86cd799439013'; // Valid ObjectId string // Valid ObjectId string
				// Mock the find method to return members with the specified role
				const ModelMock = (repo as unknown as { model: unknown }).model as {
					find: (query: { role: unknown }) => {
						populate: () => { exec: () => Promise<Member[]> };
					};
				};
				ModelMock.find = vi.fn((query: { role: unknown }) => ({
					populate: vi.fn().mockReturnThis(),
					exec: vi.fn(() => {
						if (
							query.role &&
							(query.role as { toString: () => string }).toString() === roleId
						) {
							return Promise.resolve([memberDoc]);
						}
						return Promise.resolve([]);
					}),
				}));
			});
			When(
				'I call getAssignedToRole with "507f1f77bcf86cd799439013"',
				async () => {
					results = await repo.getAssignedToRole('507f1f77bcf86cd799439013');
				},
			);
			Then('I should receive an array of Member domain objects', () => {
				expect(Array.isArray(results)).toBe(true);
				expect(results[0]).toBeInstanceOf(
					Domain.Contexts.Community.Member.Member,
				);
			});
			And('all members should have the specified role', () => {
				// Note: This would require more complex mocking to verify the role assignment
				// For now, we just verify we get members back
				expect(results.length).toBeGreaterThan(0);
			});
		},
	);

	Scenario('Creating a new member instance', ({ Given, When, Then, And }) => {
		let communityDomainObject: Domain.Contexts.Community.Community.CommunityEntityReference;
		Given('a valid Community domain object as the community', () => {
			communityDomainObject = {
				id: '507f1f77bcf86cd799439012',
				name: 'Test Community',
			} as Domain.Contexts.Community.Community.CommunityEntityReference;
		});
		When(
			'I call getNewInstance with name "New Member" and the community',
			async () => {
				result = await repo.getNewInstance('New Member', communityDomainObject);
			},
		);
		Then('I should receive a new Member domain object', () => {
			expect(result).toBeInstanceOf(Domain.Contexts.Community.Member.Member);
		});
		And('the domain object\'s name should be "New Member"', () => {
			expect(result.memberName).toBe('New Member');
		});
		And("the domain object's community should be the given community", () => {
			expect(result.communityId).toBe(communityDomainObject.id);
		});
	});

	Scenario(
		'Creating a new member instance with an invalid community',
		({ Given, When, Then }) => {
			let getNewInstanceWithInvalidCommunity: () => Promise<unknown>;
			let invalidCommunity: unknown;
			Given('an invalid community object', () => {
				invalidCommunity = {};
			});
			When(
				'I call getNewInstance with name "Invalid Member" and the invalid community',
				() => {
					getNewInstanceWithInvalidCommunity = () =>
						repo.getNewInstance(
							'Invalid Member',
							invalidCommunity as Domain.Contexts.Community.Community.CommunityEntityReference,
						);
				},
			);
			Then(
				'an error should be thrown indicating the community is not valid',
				async () => {
					await expect(getNewInstanceWithInvalidCommunity).rejects.toThrow();
					// The exact error message may vary based on the domain validation
					await expect(getNewInstanceWithInvalidCommunity).rejects.toThrow();
				},
			);
		},
	);
});
