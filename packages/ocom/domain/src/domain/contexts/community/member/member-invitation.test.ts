import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { PermissionError } from '@cellix/domain-seedwork/domain-entity';
import { expect, vi } from 'vitest';
import type { CasePassport } from '../../case/case.passport.ts';
import type { Passport } from '../../passport.ts';
import type { PropertyPassport } from '../../property/property.passport.ts';
import type { ServicePassport } from '../../service/service.passport.ts';
import type { EndUserEntityReference } from '../../user/end-user/end-user.ts';
import type { UserPassport } from '../../user/user.passport.ts';
import { MemberInvitation, type MemberInvitationProps } from './member-invitation.ts';

const test = { for: describeFeature };
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feature = await loadFeature(path.resolve(__dirname, 'features/member-invitation.feature'));

const COMMUNITY_ID = 'community-abc';
const INVITED_BY_ID = 'user-123';

function futureDate(daysFromNow = 7): Date {
	const d = new Date();
	d.setDate(d.getDate() + daysFromNow);
	return d;
}

function pastDate(daysAgo = 1): Date {
	const d = new Date();
	d.setDate(d.getDate() - daysAgo);
	return d;
}

function createMockPassport(permissions: { canManageMembers?: boolean; isSystemAccount?: boolean } = {}): Passport {
	return {
		community: {
			forCommunity: vi.fn(() => ({
				determineIf: vi.fn((fn: (p: { canManageMembers: boolean; isSystemAccount: boolean }) => boolean) =>
					fn({
						canManageMembers: permissions.canManageMembers ?? true,
						isSystemAccount: permissions.isSystemAccount ?? false,
					}),
				),
			})),
		},
		get case(): CasePassport {
			return {} as CasePassport;
		},
		get property(): PropertyPassport {
			return {} as PropertyPassport;
		},
		get service(): ServicePassport {
			return {} as ServicePassport;
		},
		get user(): UserPassport {
			return {} as UserPassport;
		},
	};
}

function createInvitedBy(id = INVITED_BY_ID): EndUserEntityReference {
	return { id } as EndUserEntityReference;
}

function createBaseProps(overrides: Partial<MemberInvitationProps> = {}): MemberInvitationProps {
	return {
		id: 'inv-001',
		communityId: COMMUNITY_ID,
		email: 'invitee@example.com',
		message: 'Welcome!',
		status: 'PENDING',
		expiresAt: futureDate(),
		invitedBy: createInvitedBy(),
		acceptedBy: undefined,
		createdAt: new Date(),
		updatedAt: new Date(),
		...overrides,
	};
}

function createNewInvitation(passport: Passport, overrides: { email?: string; message?: string; expiresAt?: Date; communityId?: string } = {}): MemberInvitation<MemberInvitationProps> {
	return MemberInvitation.getNewInstance(
		createBaseProps({ communityId: overrides.communityId ?? COMMUNITY_ID }),
		passport,
		overrides.communityId ?? COMMUNITY_ID,
		overrides.email ?? 'invitee@example.com',
		overrides.message ?? 'Welcome!',
		overrides.expiresAt ?? futureDate(),
		createInvitedBy(),
	);
}

function createExistingInvitation(passport: Passport, propsOverrides: Partial<MemberInvitationProps> = {}): MemberInvitation<MemberInvitationProps> {
	return new MemberInvitation(createBaseProps(propsOverrides), passport);
}

test.for(feature, ({ Scenario, Background, BeforeEachScenario }) => {
	let passport: Passport;
	let invitation: MemberInvitation<MemberInvitationProps>;
	let thrownError: Error | undefined;

	BeforeEachScenario(() => {
		passport = createMockPassport({ canManageMembers: true });
		thrownError = undefined;
	});

	Background(({ Given, And }) => {
		Given('a valid Passport with permission to manage members', () => {
			passport = createMockPassport({ canManageMembers: true });
		});
		And('a valid communityId "community-abc"', () => {
			// COMMUNITY_ID constant used throughout
		});
		And('a valid invitedBy EndUserEntityReference with id "user-123"', () => {
			// createInvitedBy() helper used throughout
		});
		And('base invitation props with id "inv-001", communityId "community-abc", email "invitee@example.com", message "Welcome!", status "PENDING", a future expiresAt, and valid timestamps', () => {
			// createBaseProps() helper used throughout
		});
	});

	// getNewInstance scenarios
	Scenario('Creating a new invitation with permission to manage members', ({ Given, When, Then, And }) => {
		Given('a passport with permission to manage members', () => {
			passport = createMockPassport({ canManageMembers: true });
		});

		When('I create a new MemberInvitation using getNewInstance with email "invitee@example.com", message "Welcome!", and expiresAt 7 days from now', () => {
			invitation = createNewInvitation(passport, { email: 'invitee@example.com', message: 'Welcome!' });
		});

		Then('the invitation email should be "invitee@example.com"', () => {
			expect(invitation.email).toBe('invitee@example.com');
		});

		And('the invitation message should be "Welcome!"', () => {
			expect(invitation.message).toBe('Welcome!');
		});

		And('the invitation status should be "PENDING"', () => {
			expect(invitation.status).toBe('PENDING');
		});

		And('the invitation communityId should be "community-abc"', () => {
			expect(invitation.communityId).toBe(COMMUNITY_ID);
		});

		And('the invitation invitedBy id should be "user-123"', () => {
			expect(invitation.invitedBy.id).toBe(INVITED_BY_ID);
		});
	});

	Scenario('Creating a new invitation with system account permission', ({ Given, When, Then, And }) => {
		Given('a passport with system account permission', () => {
			passport = createMockPassport({ canManageMembers: false, isSystemAccount: true });
		});

		When('I create a new MemberInvitation using getNewInstance with email "invitee@example.com", message "Welcome!", and expiresAt 7 days from now', () => {
			invitation = createNewInvitation(passport);
		});

		Then('the invitation email should be "invitee@example.com"', () => {
			expect(invitation.email).toBe('invitee@example.com');
		});

		And('the invitation status should be "PENDING"', () => {
			expect(invitation.status).toBe('PENDING');
		});
	});

	Scenario('Creating a new invitation without permission', ({ Given, When, Then }) => {
		Given('a passport without permission to manage members or system account', () => {
			passport = createMockPassport({ canManageMembers: false, isSystemAccount: false });
		});

		When('I try to create a new MemberInvitation using getNewInstance', () => {
			try {
				createNewInvitation(passport);
			} catch (e) {
				thrownError = e as Error;
			}
		});

		Then('a PermissionError should be thrown', () => {
			expect(thrownError).toBeInstanceOf(PermissionError);
		});
	});

	// requestMarkAsSent scenarios
	Scenario('Marking a pending invitation as sent with permission', ({ Given, When, Then }) => {
		Given('a MemberInvitation in PENDING status with permission to manage members', () => {
			passport = createMockPassport({ canManageMembers: true });
			invitation = createExistingInvitation(passport, { status: 'PENDING' });
		});

		When('I call requestMarkAsSent', () => {
			invitation.requestMarkAsSent();
		});

		Then('the invitation status should be "SENT"', () => {
			expect(invitation.status).toBe('SENT');
		});
	});

	Scenario('Marking a non-pending invitation as sent', ({ Given, When, Then }) => {
		Given('a MemberInvitation in ACCEPTED status with permission to manage members', () => {
			passport = createMockPassport({ canManageMembers: true });
			invitation = createExistingInvitation(passport, { status: 'ACCEPTED' });
		});

		When('I try to call requestMarkAsSent', () => {
			try {
				invitation.requestMarkAsSent();
			} catch (e) {
				thrownError = e as Error;
			}
		});

		Then('an error should be thrown indicating only pending invitations can be sent', () => {
			expect(thrownError?.message).toMatch(/pending/i);
		});
	});

	Scenario('Marking as sent without permission', ({ Given, When, Then }) => {
		Given('a MemberInvitation in PENDING status without permission to manage members', () => {
			passport = createMockPassport({ canManageMembers: false, isSystemAccount: false });
			invitation = createExistingInvitation(passport, { status: 'PENDING' });
		});

		When('I try to call requestMarkAsSent', () => {
			try {
				invitation.requestMarkAsSent();
			} catch (e) {
				thrownError = e as Error;
			}
		});

		Then('an error should be thrown', () => {
			expect(thrownError).toBeDefined();
		});
	});

	// requestAccept scenarios
	Scenario('Accepting an active invitation', ({ Given, When, Then, And }) => {
		let acceptedBy: EndUserEntityReference;
		Given('a MemberInvitation in SENT status with permission to manage members', () => {
			passport = createMockPassport({ canManageMembers: true });
			invitation = createExistingInvitation(passport, { status: 'SENT' });
		});

		And('a valid acceptedBy EndUserEntityReference with id "acceptor-456"', () => {
			acceptedBy = { id: 'acceptor-456' } as EndUserEntityReference;
		});

		When('I call requestAccept with the acceptedBy reference', () => {
			invitation.requestAccept(acceptedBy);
		});

		Then('the invitation status should be "ACCEPTED"', () => {
			expect(invitation.status).toBe('ACCEPTED');
		});

		And('the invitation acceptedBy id should be "acceptor-456"', () => {
			expect(invitation.acceptedBy?.id).toBe('acceptor-456');
		});
	});

	Scenario('Accepting a pending invitation', ({ Given, When, Then, And }) => {
		let acceptedBy: EndUserEntityReference;
		Given('a MemberInvitation in PENDING status with permission to manage members', () => {
			passport = createMockPassport({ canManageMembers: true });
			invitation = createExistingInvitation(passport, { status: 'PENDING' });
		});

		And('a valid acceptedBy EndUserEntityReference with id "acceptor-456"', () => {
			acceptedBy = { id: 'acceptor-456' } as EndUserEntityReference;
		});

		When('I call requestAccept with the acceptedBy reference', () => {
			invitation.requestAccept(acceptedBy);
		});

		Then('the invitation status should be "ACCEPTED"', () => {
			expect(invitation.status).toBe('ACCEPTED');
		});
	});

	Scenario('Accepting an inactive invitation', ({ Given, When, Then, And }) => {
		let acceptedBy: EndUserEntityReference;
		Given('a MemberInvitation in REJECTED status with permission to manage members', () => {
			passport = createMockPassport({ canManageMembers: true });
			invitation = createExistingInvitation(passport, { status: 'REJECTED' });
		});

		And('a valid acceptedBy EndUserEntityReference with id "acceptor-456"', () => {
			acceptedBy = { id: 'acceptor-456' } as EndUserEntityReference;
		});

		When('I try to call requestAccept with the acceptedBy reference', () => {
			try {
				invitation.requestAccept(acceptedBy);
			} catch (e) {
				thrownError = e as Error;
			}
		});

		Then('an error should be thrown indicating the invitation is not active', () => {
			expect(thrownError?.message).toMatch(/inactive|not active/i);
		});
	});

	// requestReject scenarios
	Scenario('Rejecting an active invitation', ({ Given, When, Then }) => {
		Given('a MemberInvitation in SENT status with permission to manage members', () => {
			passport = createMockPassport({ canManageMembers: true });
			invitation = createExistingInvitation(passport, { status: 'SENT' });
		});

		When('I call requestReject', () => {
			invitation.requestReject();
		});

		Then('the invitation status should be "REJECTED"', () => {
			expect(invitation.status).toBe('REJECTED');
		});
	});

	Scenario('Rejecting an inactive invitation', ({ Given, When, Then }) => {
		Given('a MemberInvitation in ACCEPTED status with permission to manage members', () => {
			passport = createMockPassport({ canManageMembers: true });
			invitation = createExistingInvitation(passport, { status: 'ACCEPTED' });
		});

		When('I try to call requestReject', () => {
			try {
				invitation.requestReject();
			} catch (e) {
				thrownError = e as Error;
			}
		});

		Then('an error should be thrown indicating the invitation is not active', () => {
			expect(thrownError?.message).toMatch(/inactive|not active/i);
		});
	});

	// requestMarkAsExpired scenarios
	Scenario('Marking an invitation as expired with permission', ({ Given, When, Then }) => {
		Given('a MemberInvitation in SENT status with permission to manage members', () => {
			passport = createMockPassport({ canManageMembers: true });
			invitation = createExistingInvitation(passport, { status: 'SENT' });
		});

		When('I call requestMarkAsExpired', () => {
			invitation.requestMarkAsExpired();
		});

		Then('the invitation status should be "EXPIRED"', () => {
			expect(invitation.status).toBe('EXPIRED');
		});
	});

	Scenario('Marking as expired without permission', ({ Given, When, Then }) => {
		Given('a MemberInvitation in SENT status without permission to manage members', () => {
			passport = createMockPassport({ canManageMembers: false, isSystemAccount: false });
			invitation = createExistingInvitation(passport, { status: 'SENT' });
		});

		When('I try to call requestMarkAsExpired', () => {
			try {
				invitation.requestMarkAsExpired();
			} catch (e) {
				thrownError = e as Error;
			}
		});

		Then('an error should be thrown', () => {
			expect(thrownError).toBeDefined();
		});
	});

	// requestExtendExpiration scenarios
	Scenario('Extending expiration of an active invitation with permission', ({ Given, When, Then }) => {
		let newExpiry: Date;
		Given('a MemberInvitation in PENDING status with permission to manage members', () => {
			passport = createMockPassport({ canManageMembers: true });
			invitation = createExistingInvitation(passport, { status: 'PENDING' });
		});

		When('I call requestExtendExpiration with a new date 14 days from now', () => {
			newExpiry = futureDate(14);
			invitation.requestExtendExpiration(newExpiry);
		});

		Then('the invitation expiresAt should be updated', () => {
			expect(invitation.expiresAt).toEqual(newExpiry);
		});
	});

	Scenario('Extending expiration of an inactive invitation', ({ Given, When, Then }) => {
		Given('a MemberInvitation in ACCEPTED status with permission to manage members', () => {
			passport = createMockPassport({ canManageMembers: true });
			invitation = createExistingInvitation(passport, { status: 'ACCEPTED' });
		});

		When('I try to call requestExtendExpiration with a new date 14 days from now', () => {
			try {
				invitation.requestExtendExpiration(futureDate(14));
			} catch (e) {
				thrownError = e as Error;
			}
		});

		Then('an error should be thrown indicating the invitation is not active', () => {
			expect(thrownError?.message).toMatch(/inactive|not active/i);
		});
	});

	// isExpired / isActive scenarios
	Scenario('Checking isExpired when expiresAt is in the past', ({ Given, When, Then }) => {
		Given('a MemberInvitation with expiresAt in the past', () => {
			passport = createMockPassport({ canManageMembers: true });
			invitation = createExistingInvitation(passport, { status: 'PENDING', expiresAt: pastDate() });
		});

		When('I check isExpired', () => {
			// accessed in assertion
		});

		Then('isExpired should be true', () => {
			expect(invitation.isExpired).toBe(true);
		});
	});

	Scenario('Checking isExpired when status is EXPIRED but date is in the future', ({ Given, When, Then }) => {
		Given('a MemberInvitation in EXPIRED status with expiresAt in the future', () => {
			passport = createMockPassport({ canManageMembers: true });
			invitation = createExistingInvitation(passport, { status: 'EXPIRED', expiresAt: futureDate() });
		});

		When('I check isExpired', () => {
			// accessed in assertion
		});

		Then('isExpired should be true', () => {
			expect(invitation.isExpired).toBe(true);
		});
	});

	Scenario('Checking isActive on a pending non-expired invitation', ({ Given, When, Then }) => {
		Given('a MemberInvitation in PENDING status with a future expiresAt', () => {
			passport = createMockPassport({ canManageMembers: true });
			invitation = createExistingInvitation(passport, { status: 'PENDING', expiresAt: futureDate() });
		});

		When('I check isActive', () => {
			// accessed in assertion
		});

		Then('isActive should be true', () => {
			expect(invitation.isActive).toBe(true);
		});
	});

	Scenario('Checking isActive on an expired invitation', ({ Given, When, Then }) => {
		Given('a MemberInvitation with expiresAt in the past', () => {
			passport = createMockPassport({ canManageMembers: true });
			invitation = createExistingInvitation(passport, { status: 'PENDING', expiresAt: pastDate() });
		});

		When('I check isActive', () => {
			// accessed in assertion
		});

		Then('isActive should be false', () => {
			expect(invitation.isActive).toBe(false);
		});
	});
});
