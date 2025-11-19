import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';
import type { ServiceTicketV1EntityReference } from '../../../contexts/case/service-ticket/v1/service-ticket-v1.aggregate.ts';
import type { MemberEntityReference } from '../../../contexts/community/member/member.ts';
import { MemberServiceTicketVisa } from './member.service-ticket.visa.ts';

const test = { for: describeFeature };
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feature = await loadFeature(
	path.resolve(__dirname, 'features/member.service-ticket.visa.feature'),
);

function makeServiceTicket(
	id = 'ticket-1',
	communityId = 'community-1',
	requestorId = 'member-1',
	assignedToId = 'member-2',
) {
	return {
		id,
		communityId,
		requestorId,
		assignedToId,
	} as ServiceTicketV1EntityReference;
}

function makeMember(
	id = 'member-1',
	communityId = 'community-1',
	roleOverrides: Partial<{
		communityPermissions: Record<string, unknown>;
	}> = {},
) {
	return {
		id,
		community: { id: communityId },
		role: {
			permissions: {
				communityPermissions: {
					canCreateTickets: true,
					...roleOverrides.communityPermissions,
				},
			},
		},
	} as unknown as MemberEntityReference;
}

test.for(feature, ({ Scenario, Background, BeforeEachScenario }) => {
	let ticket: ServiceTicketV1EntityReference;
	let member: MemberEntityReference;
	let visa: MemberServiceTicketVisa<ServiceTicketV1EntityReference>;

	BeforeEachScenario(() => {
		ticket = makeServiceTicket();
		member = makeMember();
		visa =
			undefined as unknown as MemberServiceTicketVisa<ServiceTicketV1EntityReference>;
	});

	Background(({ Given, And }) => {
		Given(
			'a valid ServiceTicketV1EntityReference with id "ticket-1", communityId "community-1", requestorId "member-1", assignedToId "member-2"',
			() => {
				ticket = makeServiceTicket(
					'ticket-1',
					'community-1',
					'member-1',
					'member-2',
				);
			},
		);
		And(
			'a valid MemberEntityReference with id "member-1", community id "community-1", and role with community permissions',
			() => {
				member = makeMember('member-1', 'community-1');
			},
		);
	});

	Scenario(
		'Creating a MemberServiceTicketVisa with a member belonging to the community',
		({ When, Then }) => {
			When(
				'I create a MemberServiceTicketVisa with the ticket and member',
				() => {
					visa = new MemberServiceTicketVisa(ticket, member);
				},
			);
			Then('the visa should be created successfully', () => {
				expect(visa).toBeInstanceOf(MemberServiceTicketVisa);
			});
		},
	);

	Scenario(
		'determineIf returns true when the permission function returns true',
		({ Given, When, Then }) => {
			let result: boolean;
			Given('a MemberServiceTicketVisa for the ticket and member', () => {
				visa = new MemberServiceTicketVisa(ticket, member);
			});
			When(
				'I call determineIf with a function that returns true if canCreateTickets is true',
				() => {
					result = visa.determineIf((p) => p.canCreateTickets === true);
				},
			);
			Then('the result should be true', () => {
				expect(result).toBe(true);
			});
		},
	);

	Scenario(
		'determineIf returns false when the permission function returns false',
		({ Given, When, Then }) => {
			let result: boolean;
			Given('a MemberServiceTicketVisa for the ticket and member', () => {
				visa = new MemberServiceTicketVisa(ticket, member);
			});
			When('I call determineIf with a function that returns false', () => {
				result = visa.determineIf(() => false);
			});
			Then('the result should be false', () => {
				expect(result).toBe(false);
			});
		},
	);

	Scenario(
		'determineIf returns false if the member does not belong to the community',
		({ Given, And, When, Then }) => {
			let result: boolean;
			Given('a MemberEntityReference with community id "community-2"', () => {
				member = makeMember('member-1', 'community-2');
			});
			And(
				'a ServiceTicketV1EntityReference with communityId "community-1"',
				() => {
					ticket = makeServiceTicket(
						'ticket-1',
						'community-1',
						'member-1',
						'member-2',
					);
				},
			);
			When(
				'I create a MemberServiceTicketVisa with the ticket and member',
				() => {
					visa = new MemberServiceTicketVisa(ticket, member);
				},
			);
			And('I call determineIf with any function', () => {
				result = visa.determineIf(() => true);
			});
			Then('the result should be false', () => {
				expect(result).toBe(false);
			});
		},
	);

	Scenario(
		'determineIf sets canCreateTickets to true',
		({ Given, When, Then }) => {
			let result: boolean;
			Given('a MemberServiceTicketVisa for the ticket and member', () => {
				visa = new MemberServiceTicketVisa(ticket, member);
			});
			When(
				'I call determineIf with a function that returns canCreateTickets',
				() => {
					result = visa.determineIf((p) => p.canCreateTickets);
				},
			);
			Then('the result should be true', () => {
				expect(result).toBe(true);
			});
		},
	);

	Scenario(
		'determineIf sets canManageTickets to false',
		({ Given, When, Then }) => {
			let result: boolean;
			Given('a MemberServiceTicketVisa for the ticket and member', () => {
				visa = new MemberServiceTicketVisa(ticket, member);
			});
			When(
				'I call determineIf with a function that returns canManageTickets',
				() => {
					result = visa.determineIf((p) => p.canManageTickets);
				},
			);
			Then('the result should be false', () => {
				expect(result).toBe(false);
			});
		},
	);

	Scenario(
		'determineIf sets canAssignTickets to false',
		({ Given, When, Then }) => {
			let result: boolean;
			Given('a MemberServiceTicketVisa for the ticket and member', () => {
				visa = new MemberServiceTicketVisa(ticket, member);
			});
			When(
				'I call determineIf with a function that returns canAssignTickets',
				() => {
					result = visa.determineIf((p) => p.canAssignTickets);
				},
			);
			Then('the result should be false', () => {
				expect(result).toBe(false);
			});
		},
	);

	Scenario(
		'determineIf sets canWorkOnTickets to false',
		({ Given, When, Then }) => {
			let result: boolean;
			Given('a MemberServiceTicketVisa for the ticket and member', () => {
				visa = new MemberServiceTicketVisa(ticket, member);
			});
			When(
				'I call determineIf with a function that returns canWorkOnTickets',
				() => {
					result = visa.determineIf((p) => p.canWorkOnTickets);
				},
			);
			Then('the result should be false', () => {
				expect(result).toBe(false);
			});
		},
	);

	Scenario(
		'determineIf sets isEditingOwnTicket to true when member is the requestor',
		({ Given, When, Then }) => {
			let result: boolean;
			Given('a MemberServiceTicketVisa for the ticket and member', () => {
				visa = new MemberServiceTicketVisa(ticket, member);
			});
			When(
				'I call determineIf with a function that returns isEditingOwnTicket',
				() => {
					result = visa.determineIf((p) => p.isEditingOwnTicket);
				},
			);
			Then('the result should be true', () => {
				expect(result).toBe(true);
			});
		},
	);

	Scenario(
		'determineIf sets isEditingOwnTicket to false when member is not the requestor',
		({ Given, When, Then, And }) => {
			let result: boolean;
			Given('a MemberEntityReference with id "member-2"', () => {
				member = makeMember('member-2', 'community-1');
			});
			When(
				'I create a MemberServiceTicketVisa with the ticket and member',
				() => {
					visa = new MemberServiceTicketVisa(ticket, member);
				},
			);
			And(
				'I call determineIf with a function that returns isEditingOwnTicket',
				() => {
					result = visa.determineIf((p) => p.isEditingOwnTicket);
				},
			);
			Then('the result should be false', () => {
				expect(result).toBe(false);
			});
		},
	);

	Scenario(
		'determineIf sets isEditingAssignedTicket to false when member is not assigned',
		({ Given, When, Then }) => {
			let result: boolean;
			Given('a MemberServiceTicketVisa for the ticket and member', () => {
				visa = new MemberServiceTicketVisa(ticket, member);
			});
			When(
				'I call determineIf with a function that returns isEditingAssignedTicket',
				() => {
					result = visa.determineIf((p) => p.isEditingAssignedTicket);
				},
			);
			Then('the result should be false', () => {
				expect(result).toBe(false);
			});
		},
	);

	Scenario(
		'determineIf sets isEditingAssignedTicket to true when member is assigned',
		({ Given, When, Then, And }) => {
			let result: boolean;
			Given('a MemberEntityReference with id "member-2"', () => {
				member = makeMember('member-2', 'community-1');
			});
			When(
				'I create a MemberServiceTicketVisa with the ticket and member',
				() => {
					visa = new MemberServiceTicketVisa(ticket, member);
				},
			);
			And(
				'I call determineIf with a function that returns isEditingAssignedTicket',
				() => {
					result = visa.determineIf((p) => p.isEditingAssignedTicket);
				},
			);
			Then('the result should be true', () => {
				expect(result).toBe(true);
			});
		},
	);

	Scenario(
		'determineIf sets isSystemAccount to false',
		({ Given, When, Then }) => {
			let result: boolean;
			Given('a MemberServiceTicketVisa for the ticket and member', () => {
				visa = new MemberServiceTicketVisa(ticket, member);
			});
			When(
				'I call determineIf with a function that returns isSystemAccount',
				() => {
					result = visa.determineIf((p) => p.isSystemAccount);
				},
			);
			Then('the result should be false', () => {
				expect(result).toBe(false);
			});
		},
	);
});
