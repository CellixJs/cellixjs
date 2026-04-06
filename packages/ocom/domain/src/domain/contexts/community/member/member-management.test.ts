import { describe, expect, it, vi } from 'vitest';
import { PermissionError } from '@cellix/domain-seedwork/domain-entity';
import { Member, type MemberProps } from './member.ts';
import { MemberActivatedEvent } from '../../../events/types/member-activated.ts';
import { MemberDeactivatedEvent } from '../../../events/types/member-deactivated.ts';
import { MemberRemovedEvent } from '../../../events/types/member-removed.ts';
import type { Passport } from '../../passport.ts';
import type { CasePassport } from '../../case/case.passport.ts';
import type { PropertyPassport } from '../../property/property.passport.ts';
import type { ServicePassport } from '../../service/service.passport.ts';
import type { UserPassport } from '../../user/user.passport.ts';
import type { CommunityEntityReference } from '../community/community.ts';
import type { EndUserRoleEntityReference } from '../role/end-user-role/end-user-role.ts';
import type { MemberProfileProps } from './member-profile.ts';
import type { MemberAccountProps } from './member-account.ts';

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
		// Create minimal mock implementations for required passport properties
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

function createMemberProps(): MemberProps {
	return {
		id: 'test-member-id',
		memberName: 'Test Member',
		cybersourceCustomerId: 'test-customer-id',
		communityId: 'test-community-id',
		community: { id: 'test-community-id' } as CommunityEntityReference,
		loadCommunity: vi.fn(),
		accounts: [],
		role: { id: 'test-role-id' } as EndUserRoleEntityReference,
		loadRole: vi.fn(),
		customViews: [],
		profile: { id: 'test-profile-id' } as MemberProfileProps,
		createdAt: new Date(),
		updatedAt: new Date(),
		schemaVersion: '1.0.0',
	};
}

describe('Member Management Domain Operations', () => {
	describe('requestActivateMember', () => {
		it('should activate a member with pending account and raise MemberActivatedEvent', () => {
			const passport = createMockPassport({ canManageMembers: true });
			const props = createMemberProps();
			// Add a pending account to activate
			props.accounts = [
				{
					id: 'account-1',
					statusCode: 'CREATED',
					emailAddress: 'test@example.com',
				} as MemberAccountProps,
			];
			const member = new Member(props, passport);

			member.requestActivateMember();

			// Check that domain event was raised
			const events = member.getUncommittedEvents();
			expect(events).toHaveLength(1);
			expect(events[0]).toBeInstanceOf(MemberActivatedEvent);

			const event = events[0] as MemberActivatedEvent;
			expect(event.payload.memberId).toBe('test-member-id');
			expect(event.payload.communityId).toBe('test-community-id');

			// Check account was activated
			expect(props.accounts[0].statusCode).toBe('ACCEPTED');
		});

		it('should fail when user lacks management permissions', () => {
			const passport = createMockPassport({ canManageMembers: false });
			const props = createMemberProps();
			props.accounts = [
				{
					id: 'account-1',
					statusCode: 'CREATED',
					emailAddress: 'test@example.com',
				} as MemberAccountProps,
			];
			const member = new Member(props, passport);

			expect(() => {
				member.requestActivateMember();
			}).toThrow(PermissionError);
		});

		it('should throw error when no pending account found', () => {
			const passport = createMockPassport({ canManageMembers: true });
			const props = createMemberProps();
			// No pending accounts
			props.accounts = [
				{
					id: 'account-1',
					statusCode: 'ACCEPTED',
					emailAddress: 'test@example.com',
				} as MemberAccountProps,
			];
			const member = new Member(props, passport);

			expect(() => {
				member.requestActivateMember();
			}).toThrow('No pending account found to activate');
		});
	});

	describe('requestDeactivateMember', () => {
		it('should deactivate a member with active account and raise MemberDeactivatedEvent', () => {
			const passport = createMockPassport({ canManageMembers: true });
			const props = createMemberProps();
			// Add an active account to deactivate
			props.accounts = [
				{
					id: 'account-1',
					statusCode: 'ACCEPTED',
					emailAddress: 'test@example.com',
				} as MemberAccountProps,
			];
			const member = new Member(props, passport);

			member.requestDeactivateMember();

			const events = member.getUncommittedEvents();
			expect(events).toHaveLength(1);
			expect(events[0]).toBeInstanceOf(MemberDeactivatedEvent);

			const event = events[0] as MemberDeactivatedEvent;
			expect(event.payload.memberId).toBe('test-member-id');
			expect(event.payload.communityId).toBe('test-community-id');
			expect(event.payload.deactivatedBy).toBe('system');

			// Check account was deactivated
			expect(props.accounts[0].statusCode).toBe('REJECTED');
		});

		it('should fail when user lacks management permissions', () => {
			const passport = createMockPassport({ canManageMembers: false });
			const props = createMemberProps();
			props.accounts = [
				{
					id: 'account-1',
					statusCode: 'ACCEPTED',
					emailAddress: 'test@example.com',
				} as MemberAccountProps,
			];
			const member = new Member(props, passport);

			expect(() => {
				member.requestDeactivateMember();
			}).toThrow(PermissionError);
		});

		it('should throw error when no active account found', () => {
			const passport = createMockPassport({ canManageMembers: true });
			const props = createMemberProps();
			// No active accounts
			props.accounts = [
				{
					id: 'account-1',
					statusCode: 'CREATED',
					emailAddress: 'test@example.com',
				} as MemberAccountProps,
			];
			const member = new Member(props, passport);

			expect(() => {
				member.requestDeactivateMember();
			}).toThrow('No active account found to deactivate');
		});
	});

	describe('requestRemoveMember', () => {
		it('should remove a member and raise MemberRemovedEvent', () => {
			const passport = createMockPassport({ canManageMembers: true });
			const props = createMemberProps();
			// Add accounts to remove
			props.accounts = [{ id: 'account-1', statusCode: 'ACCEPTED', emailAddress: 'test1@example.com' } as MemberAccountProps, { id: 'account-2', statusCode: 'CREATED', emailAddress: 'test2@example.com' } as MemberAccountProps];
			const member = new Member(props, passport);

			member.requestRemoveMember();

			const events = member.getUncommittedEvents();
			expect(events).toHaveLength(1);
			expect(events[0]).toBeInstanceOf(MemberRemovedEvent);

			const event = events[0] as MemberRemovedEvent;
			expect(event.payload.memberId).toBe('test-member-id');
			expect(event.payload.communityId).toBe('test-community-id');
			expect(event.payload.removedBy).toBe('system');

			// Check all accounts were rejected
			expect(props.accounts[0].statusCode).toBe('REJECTED');
			expect(props.accounts[1].statusCode).toBe('REJECTED');
		});

		it('should fail when user lacks management permissions', () => {
			const passport = createMockPassport({ canManageMembers: false });
			const props = createMemberProps();
			props.accounts = [
				{
					id: 'account-1',
					statusCode: 'ACCEPTED',
					emailAddress: 'test@example.com',
				} as MemberAccountProps,
			];
			const member = new Member(props, passport);

			expect(() => {
				member.requestRemoveMember();
			}).toThrow(PermissionError);
		});
	});

	describe('Member Status Properties', () => {
		it('should identify active members correctly', () => {
			const passport = createMockPassport({ canManageMembers: true });
			const props = createMemberProps();
			props.accounts = [
				{
					id: 'account-1',
					statusCode: 'ACCEPTED',
					emailAddress: 'test@example.com',
				} as MemberAccountProps,
			];
			const member = new Member(props, passport);

			expect(member.isActiveMember).toBe(true);
		});

		it('should identify inactive members correctly', () => {
			const passport = createMockPassport({ canManageMembers: true });
			const props = createMemberProps();
			props.accounts = [
				{
					id: 'account-1',
					statusCode: 'REJECTED',
					emailAddress: 'test@example.com',
				} as MemberAccountProps,
			];
			const member = new Member(props, passport);

			expect(member.isActiveMember).toBe(false);
		});

		it('should identify pending activation correctly', () => {
			const passport = createMockPassport({ canManageMembers: true });
			const props = createMemberProps();
			props.accounts = [
				{
					id: 'account-1',
					statusCode: 'CREATED',
					emailAddress: 'test@example.com',
				} as MemberAccountProps,
			];
			const member = new Member(props, passport);

			expect(member.hasPendingActivation).toBe(true);
		});
	});

	describe('Permission Validation', () => {
		it('should allow system accounts to perform operations', () => {
			const passport = createMockPassport({ isSystemAccount: true });
			const props = createMemberProps();
			props.accounts = [
				{
					id: 'account-1',
					statusCode: 'CREATED',
					emailAddress: 'test@example.com',
				} as MemberAccountProps,
			];
			const member = new Member(props, passport);

			expect(() => {
				member.requestActivateMember();
			}).not.toThrow();
		});

		it('should deny operations when no permissions', () => {
			const passport = createMockPassport({ canManageMembers: false, isSystemAccount: false });
			const props = createMemberProps();
			props.accounts = [
				{
					id: 'account-1',
					statusCode: 'CREATED',
					emailAddress: 'test@example.com',
				} as MemberAccountProps,
			];
			const member = new Member(props, passport);

			expect(() => {
				member.requestActivateMember();
			}).toThrow(PermissionError);
		});
	});

	describe('Event Tracking', () => {
		it('should accumulate multiple events', () => {
			const passport = createMockPassport({ canManageMembers: true });
			const props = createMemberProps();
			props.accounts = [{ id: 'account-1', statusCode: 'CREATED', emailAddress: 'test1@example.com' } as MemberAccountProps, { id: 'account-2', statusCode: 'ACCEPTED', emailAddress: 'test2@example.com' } as MemberAccountProps];
			const member = new Member(props, passport);

			member.requestActivateMember(); // Should activate the CREATED account
			member.requestDeactivateMember(); // Should deactivate the ACCEPTED account

			const events = member.getUncommittedEvents();
			expect(events).toHaveLength(2);
			expect(events[0]).toBeInstanceOf(MemberActivatedEvent);
			expect(events[1]).toBeInstanceOf(MemberDeactivatedEvent);
		});

		it('should clear events after commit', () => {
			const passport = createMockPassport({ canManageMembers: true });
			const props = createMemberProps();
			props.accounts = [
				{
					id: 'account-1',
					statusCode: 'CREATED',
					emailAddress: 'test@example.com',
				} as MemberAccountProps,
			];
			const member = new Member(props, passport);

			member.requestActivateMember();
			expect(member.getUncommittedEvents()).toHaveLength(1);

			member.markEventsAsCommitted();
			expect(member.getUncommittedEvents()).toHaveLength(0);
		});
	});
});
