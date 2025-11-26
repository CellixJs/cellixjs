import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';
import type { ServiceTicketV1EntityReference } from '../../contexts/case/service-ticket/v1/index.ts';
import type { ViolationTicketV1EntityReference } from '../../contexts/case/violation-ticket/v1/index.ts';
import type { CommunityEntityReference } from '../../contexts/community/community/index.ts';
import type { MemberEntityReference } from '../../contexts/community/member/index.ts';
import type { PropertyEntityReference } from '../../contexts/property/property/property.aggregate.ts';
import type { ServiceEntityReference } from '../../contexts/service/service/index.ts';
import type { EndUserEntityReference } from '../../contexts/user/end-user/index.ts';
import type { StaffRoleEntityReference } from '../../contexts/user/staff-role/index.ts';
import type { StaffUserEntityReference } from '../../contexts/user/staff-user/index.ts';
import type { VendorUserEntityReference } from '../../contexts/user/vendor-user/index.ts';
import { MemberCasePassport } from './contexts/member.case.passport.ts';
import { MemberCommunityPassport } from './contexts/member.community.passport.ts';
import { MemberCommunityVisa } from './contexts/member.community.visa.ts';
import { MemberPropertyPassport } from './contexts/member.property.passport.ts';
import { MemberPropertyVisa } from './contexts/member.property.visa.ts';
import { MemberServicePassport } from './contexts/member.service.passport.ts';
import { MemberServiceVisa } from './contexts/member.service.visa.ts';
import { MemberServiceTicketVisa } from './contexts/member.service-ticket.visa.ts';
import { MemberUserEndUserVisa } from './contexts/member.user.end-user.visa.ts';
import { MemberUserPassport } from './contexts/member.user.passport.ts';
import { MemberUserStaffRoleVisa } from './contexts/member.user.staff-role.visa.ts';
import { MemberUserStaffUserVisa } from './contexts/member.user.staff-user.visa.ts';
import { MemberUserVendorUserVisa } from './contexts/member.user.vendor-user.visa.ts';
import { MemberViolationTicketVisa } from './contexts/member.violation-ticket.visa.ts';
import { MemberPassport } from './member.passport.ts';

const test = { for: describeFeature };
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feature = await loadFeature(
	path.resolve(__dirname, 'features/member.passport.feature'),
);

// Helper factories for entity references
function makeUser(id = 'user-1') {
	// biome-ignore lint/plugin/no-type-assertion: test file
	return { id } as EndUserEntityReference;
}

function makeCommunity(id = 'community-1') {
	// biome-ignore lint/plugin/no-type-assertion: test file
	return { id, name: 'Test Community' } as CommunityEntityReference;
}

function makeMember(
	userId = 'user-1',
	communityId = 'community-1',
	accountsOverride?: unknown[],
) {
	return {
		id: 'member-1',
		community: makeCommunity(communityId),
		accounts: accountsOverride ?? [{ id: 'account-1', user: makeUser(userId) }],
	// biome-ignore lint/plugin/no-type-assertion: test file
	} as unknown as MemberEntityReference;
}

test.for(feature, ({ Scenario, Background, BeforeEachScenario }) => {
	let user: EndUserEntityReference;
	let member: MemberEntityReference;
	let community: CommunityEntityReference;
	let passport: MemberPassport;

	BeforeEachScenario(() => {
		user = makeUser();
		member = makeMember();
		community = makeCommunity();
		// biome-ignore lint/plugin/no-type-assertion: test file
		passport = undefined as unknown as MemberPassport;
	});

	Background(({ Given, And }) => {
		Given('a valid EndUserEntityReference', () => {
			user = makeUser();
		});
		And(
			'a valid MemberEntityReference with at least one account for the user and a matching community',
			() => {
				member = makeMember(user.id, 'community-1');
			},
		);
		And('a valid CommunityEntityReference', () => {
			community = makeCommunity('community-1');
		});
	});

	Scenario(
		'Creating a MemberPassport with valid user, member, and community',
		({ When, Then }) => {
			When(
				'I create a MemberPassport with the user, member, and community',
				() => {
					passport = new MemberPassport(user, member, community);
				},
			);
			Then('the passport should be created successfully', () => {
				expect(passport).toBeInstanceOf(MemberPassport);
			});
		},
	);

	Scenario(
		'Creating a MemberPassport with a user who is not a member',
		({ Given, When, Then }) => {
			let createPassport: () => void;
			Given('a MemberEntityReference with no account for the user', () => {
				member = makeMember('other-user', 'community-1', []);
			});
			When(
				'I try to create a MemberPassport with the user, member, and community',
				() => {
					createPassport = () => {
						passport = new MemberPassport(user, member, community);
					};
				},
			);
			Then(
				'an error should be thrown indicating the user is not a member of the community',
				() => {
					expect(createPassport).toThrow(
						`User ${user.id} is not a member of the community ${member.community.id}`,
					);
				},
			);
		},
	);

	Scenario(
		'Creating a MemberPassport with a member whose community does not match',
		({ Given, When, Then }) => {
			let createPassport: () => void;
			Given(
				'a MemberEntityReference whose community does not match the provided CommunityEntityReference',
				() => {
					member = makeMember(user.id, 'community-2');
					community = makeCommunity('community-1');
				},
			);
			When(
				'I try to create a MemberPassport with the user, member, and community',
				() => {
					createPassport = () => {
						passport = new MemberPassport(user, member, community);
					};
				},
			);
			Then(
				'an error should be thrown indicating the member is not part of the community',
				() => {
					expect(createPassport).toThrow(
						`Member ${member.id} is not part of the community ${community.id}`,
					);
				},
			);
		},
	);

	Scenario('Accessing the community passport', ({ When, And, Then }) => {
		let communityPassport: unknown;
		When(
			'I create a MemberPassport with valid user, member, and community',
			() => {
				passport = new MemberPassport(user, member, community);
			},
		);
		And('I access the community property', () => {
			communityPassport = passport.community;
		});
		Then(
			'I should receive a MemberCommunityPassport instance with all visas',
			() => {
				expect(communityPassport).toBeInstanceOf(MemberCommunityPassport);
				expect(
					// biome-ignore lint/plugin/no-type-assertion: test file
					(communityPassport as MemberCommunityPassport).forCommunity(
						community,
					),
				).toBeInstanceOf(MemberCommunityVisa);
			},
		);
	});

	Scenario('Accessing the service passport', ({ When, And, Then }) => {
		let servicePassport: unknown;
		When(
			'I create a MemberPassport with valid user, member, and community',
			() => {
				passport = new MemberPassport(user, member, community);
			},
		);
		And('I access the service property', () => {
			servicePassport = passport.service;
		});
		Then(
			'I should receive a MemberServicePassport instance with all visas',
			() => {
				expect(servicePassport).toBeInstanceOf(MemberServicePassport);
				expect(
					// biome-ignore lint/plugin/no-type-assertion: test file
					(servicePassport as MemberServicePassport).forService(
						// biome-ignore lint/plugin/no-type-assertion: test file
						{} as ServiceEntityReference,
					),
				).toBeInstanceOf(MemberServiceVisa);
			},
		);
	});

	Scenario('Accessing the user passport', ({ When, And, Then }) => {
		let userPassport: unknown;
		When(
			'I create a MemberPassport with valid user, member, and community',
			() => {
				passport = new MemberPassport(user, member, community);
			},
		);
		And('I access the user property', () => {
			userPassport = passport.user;
		});
		Then(
			'I should receive a MemberUserPassport instance with all visas',
			() => {
				expect(userPassport).toBeInstanceOf(MemberUserPassport);
				expect(
					// biome-ignore lint/plugin/no-type-assertion: test file
					(userPassport as MemberUserPassport).forStaffUser(
						// biome-ignore lint/plugin/no-type-assertion: test file
						{} as StaffUserEntityReference,
					),
				).toBeInstanceOf(MemberUserStaffUserVisa);
				expect(
					// biome-ignore lint/plugin/no-type-assertion: test file
					(userPassport as MemberUserPassport).forStaffRole(
						// biome-ignore lint/plugin/no-type-assertion: test file
						{} as StaffRoleEntityReference,
					),
				).toBeInstanceOf(MemberUserStaffRoleVisa);
				expect(
					// biome-ignore lint/plugin/no-type-assertion: test file
					(userPassport as MemberUserPassport).forEndUser(user),
				).toBeInstanceOf(MemberUserEndUserVisa);
				expect(
					// biome-ignore lint/plugin/no-type-assertion: test file
					(userPassport as MemberUserPassport).forVendorUser(
						// biome-ignore lint/plugin/no-type-assertion: test file
						{} as VendorUserEntityReference,
					),
				).toBeInstanceOf(MemberUserVendorUserVisa);
			},
		);
	});

	Scenario('Accessing the property passport', ({ When, And, Then }) => {
		let propertyPassport: unknown;
		When(
			'I create a MemberPassport with valid user, member, and community',
			() => {
				passport = new MemberPassport(user, member, community);
			},
		);
		And('I access the property property', () => {
			propertyPassport = passport.property;
		});
		Then(
			'I should receive a MemberPropertyPassport instance with all visas',
			() => {
				expect(propertyPassport).toBeInstanceOf(MemberPropertyPassport);
				expect(
					// biome-ignore lint/plugin/no-type-assertion: test file
					(propertyPassport as MemberPropertyPassport).forProperty(
						// biome-ignore lint/plugin/no-type-assertion: test file
						{} as PropertyEntityReference,
					),
				).toBeInstanceOf(MemberPropertyVisa);
			},
		);
	});

	Scenario('Accessing the case passport', ({ When, And, Then }) => {
		let casePassport: unknown;
		When(
			'I create a MemberPassport with valid user, member, and community',
			() => {
				passport = new MemberPassport(user, member, community);
			},
		);
		And('I access the case property', () => {
			casePassport = passport.case;
		});
		Then(
			'I should receive a MemberCasePassport instance with all visas',
			() => {
				expect(casePassport).toBeInstanceOf(MemberCasePassport);
				expect(
					// biome-ignore lint/plugin/no-type-assertion: test file
					(casePassport as MemberCasePassport).forServiceTicketV1(
						// biome-ignore lint/plugin/no-type-assertion: test file
						{} as ServiceTicketV1EntityReference,
					),
				).toBeInstanceOf(MemberServiceTicketVisa);
				expect(
					// biome-ignore lint/plugin/no-type-assertion: test file
					(casePassport as MemberCasePassport).forViolationTicketV1(
						// biome-ignore lint/plugin/no-type-assertion: test file
						{} as ViolationTicketV1EntityReference,
					),
				).toBeInstanceOf(MemberViolationTicketVisa);
			},
		);
	});
});
