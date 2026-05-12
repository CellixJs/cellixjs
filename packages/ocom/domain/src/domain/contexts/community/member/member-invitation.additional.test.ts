import { describe, expect, it, vi } from 'vitest';
import type { CasePassport } from '../../case/case.passport.ts';
import type { Passport } from '../../passport.ts';
import type { PropertyPassport } from '../../property/property.passport.ts';
import type { ServicePassport } from '../../service/service.passport.ts';
import type { EndUserEntityReference } from '../../user/end-user/end-user.ts';
import type { UserPassport } from '../../user/user.passport.ts';
import { MemberInvitation, type MemberInvitationProps } from './member-invitation.ts';

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

function createInvitation(overrides: Partial<MemberInvitationProps> = {}, passport: Passport = createMockPassport()): MemberInvitation<MemberInvitationProps> {
	return new MemberInvitation(
		{
			id: 'inv-1',
			communityId: 'community-1',
			email: 'invitee@example.com',
			message: 'Welcome',
			status: 'SENT',
			expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
			invitedBy: { id: 'inviter-1' } as EndUserEntityReference,
			acceptedBy: undefined,
			createdAt: new Date(),
			updatedAt: new Date(),
			...overrides,
		},
		passport,
	);
}

describe('member-invitation additional coverage', () => {
	it('throws when accepting an invitation that is already expired', () => {
		const invitation = createInvitation({ status: 'SENT', expiresAt: new Date(Date.now() - 1000) });

		expect(() => invitation.requestAccept({ id: 'user-2' } as EndUserEntityReference)).toThrow('Cannot accept inactive invitation');
	});

	it('blocks extending expiration and editing fields without permissions', () => {
		const invitation = createInvitation({}, createMockPassport({ canManageMembers: false, isSystemAccount: false }));

		expect(() => invitation.requestExtendExpiration(new Date(Date.now() + 5 * 24 * 60 * 60 * 1000))).toThrow('Cannot extend invitation expiration');
		expect(() => {
			invitation.email = 'new@example.com';
		}).toThrow('Cannot modify invitation email');
		expect(() => {
			invitation.message = 'Updated';
		}).toThrow('Cannot modify invitation message');
		expect(() => {
			invitation.expiresAt = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000);
		}).toThrow('Cannot modify invitation expiration');
	});

	it('reports status helper flags for accepted and rejected invitations', () => {
		const acceptedInvitation = createInvitation({ status: 'ACCEPTED' });
		const rejectedInvitation = createInvitation({ status: 'REJECTED' });

		expect(acceptedInvitation.isAccepted).toBe(true);
		expect(acceptedInvitation.isSent).toBe(false);
		expect(rejectedInvitation.isRejected).toBe(true);
		expect(rejectedInvitation.isPending).toBe(false);
	});

	it('calculates days until expiration', () => {
		const invitation = createInvitation({
			expiresAt: new Date(Date.now() + 36 * 60 * 60 * 1000),
		});

		expect(invitation.daysUntilExpiration).toBeGreaterThanOrEqual(1);
		expect(invitation.daysUntilExpiration).toBeLessThanOrEqual(2);
	});
});
