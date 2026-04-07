import { describe, expect, it, vi } from 'vitest';
import { PermissionError } from '@cellix/domain-seedwork/domain-entity';
import type { PropArray } from '@cellix/domain-seedwork/prop-array';
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
import type { MemberCustomViewProps } from './member-custom-view.ts';

function createMockPropArray<T extends { id: string }>(items: T[]): PropArray<T & { id: string }> {
	return {
		get items() {
			return items as ReadonlyArray<T & { id: string }>;
		},
		addItem: vi.fn(),
		getNewItem: vi.fn(),
		removeItem: vi.fn(),
		removeAll: vi.fn(),
	} as unknown as PropArray<T & { id: string }>;
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

function createMemberProps(accountItems: MemberAccountProps[] = []): MemberProps {
	return {
		id: 'test-member-id',
		memberName: 'Test Member',
		cybersourceCustomerId: 'test-customer-id',
		communityId: 'test-community-id',
		community: { id: 'test-community-id' } as CommunityEntityReference,
		loadCommunity: vi.fn(),
		accounts: createMockPropArray(accountItems),
		role: { id: 'test-role-id' } as EndUserRoleEntityReference,
		loadRole: vi.fn(),
		customViews: createMockPropArray<MemberCustomViewProps>([]),
		profile: { id: 'test-profile-id' } as unknown as MemberProfileProps,
		createdAt: new Date(),
		updatedAt: new Date(),
		schemaVersion: '1.0.0',
	};
}

describe('Member Management Domain Operations', () => {
	describe('requestActivateMember', () => {
		it('should activate a member with pending account and raise MemberActivatedEvent', () => {
			const passport = createMockPassport({ canManageMembers: true });
			const accountItems = [{ id: 'account-1', statusCode: 'CREATED' } as unknown as MemberAccountProps];
			const member = new Member(createMemberProps(accountItems), passport);

			member.requestActivateMember();

			const events = member.getDomainEvents();
			expect(events).toHaveLength(1);
			expect(events[0]).toBeInstanceOf(MemberActivatedEvent);

			const event = events[0] as MemberActivatedEvent;
			expect(event.payload.memberId).toBe('test-member-id');
			expect(event.payload.communityId).toBe('test-community-id');

			expect(accountItems[0]?.statusCode).toBe('ACCEPTED');
		});

		it('should fail when user lacks management permissions', () => {
			const passport = createMockPassport({ canManageMembers: false });
			const member = new Member(createMemberProps([{ id: 'account-1', statusCode: 'CREATED' } as unknown as MemberAccountProps]), passport);

			expect(() => member.requestActivateMember()).toThrow(PermissionError);
		});

		it('should throw error when no pending account found', () => {
			const passport = createMockPassport({ canManageMembers: true });
			const member = new Member(createMemberProps([{ id: 'account-1', statusCode: 'ACCEPTED' } as unknown as MemberAccountProps]), passport);

			expect(() => member.requestActivateMember()).toThrow('No pending account found to activate');
		});
	});

	describe('requestDeactivateMember', () => {
		it('should deactivate a member with active account and raise MemberDeactivatedEvent', () => {
			const passport = createMockPassport({ canManageMembers: true });
			const accountItems = [{ id: 'account-1', statusCode: 'ACCEPTED' } as unknown as MemberAccountProps];
			const member = new Member(createMemberProps(accountItems), passport);

			member.requestDeactivateMember();

			const events = member.getDomainEvents();
			expect(events).toHaveLength(1);
			expect(events[0]).toBeInstanceOf(MemberDeactivatedEvent);

			const event = events[0] as MemberDeactivatedEvent;
			expect(event.payload.memberId).toBe('test-member-id');
			expect(event.payload.communityId).toBe('test-community-id');
			expect(event.payload.deactivatedBy).toBe('system');

			expect(accountItems[0]?.statusCode).toBe('REJECTED');
		});

		it('should fail when user lacks management permissions', () => {
			const passport = createMockPassport({ canManageMembers: false });
			const member = new Member(createMemberProps([{ id: 'account-1', statusCode: 'ACCEPTED' } as unknown as MemberAccountProps]), passport);

			expect(() => member.requestDeactivateMember()).toThrow(PermissionError);
		});

		it('should throw error when no active account found', () => {
			const passport = createMockPassport({ canManageMembers: true });
			const member = new Member(createMemberProps([{ id: 'account-1', statusCode: 'CREATED' } as unknown as MemberAccountProps]), passport);

			expect(() => member.requestDeactivateMember()).toThrow('No active account found to deactivate');
		});
	});

	describe('requestRemoveMember', () => {
		it('should remove a member and raise MemberRemovedEvent', () => {
			const passport = createMockPassport({ canManageMembers: true });
			const accountItems = [{ id: 'account-1', statusCode: 'ACCEPTED' } as unknown as MemberAccountProps, { id: 'account-2', statusCode: 'CREATED' } as unknown as MemberAccountProps];
			const member = new Member(createMemberProps(accountItems), passport);

			member.requestRemoveMember();

			const events = member.getDomainEvents();
			expect(events).toHaveLength(1);
			expect(events[0]).toBeInstanceOf(MemberRemovedEvent);

			const event = events[0] as MemberRemovedEvent;
			expect(event.payload.memberId).toBe('test-member-id');
			expect(event.payload.communityId).toBe('test-community-id');
			expect(event.payload.removedBy).toBe('system');

			expect(accountItems[0]?.statusCode).toBe('REJECTED');
			expect(accountItems[1]?.statusCode).toBe('REJECTED');
		});

		it('should fail when user lacks management permissions', () => {
			const passport = createMockPassport({ canManageMembers: false });
			const member = new Member(createMemberProps([{ id: 'account-1', statusCode: 'ACCEPTED' } as unknown as MemberAccountProps]), passport);

			expect(() => member.requestRemoveMember()).toThrow(PermissionError);
		});
	});

	describe('Member Status Properties', () => {
		it('should identify active members correctly', () => {
			const passport = createMockPassport({ canManageMembers: true });
			const member = new Member(createMemberProps([{ id: 'account-1', statusCode: 'ACCEPTED' } as unknown as MemberAccountProps]), passport);

			expect(member.isActiveMember).toBe(true);
		});

		it('should identify inactive members correctly', () => {
			const passport = createMockPassport({ canManageMembers: true });
			const member = new Member(createMemberProps([{ id: 'account-1', statusCode: 'REJECTED' } as unknown as MemberAccountProps]), passport);

			expect(member.isActiveMember).toBe(false);
		});

		it('should identify pending activation correctly', () => {
			const passport = createMockPassport({ canManageMembers: true });
			const member = new Member(createMemberProps([{ id: 'account-1', statusCode: 'CREATED' } as unknown as MemberAccountProps]), passport);

			expect(member.hasPendingActivation).toBe(true);
		});
	});

	describe('Permission Validation', () => {
		it('should allow system accounts to perform operations', () => {
			const passport = createMockPassport({ isSystemAccount: true });
			const member = new Member(createMemberProps([{ id: 'account-1', statusCode: 'CREATED' } as unknown as MemberAccountProps]), passport);

			expect(() => member.requestActivateMember()).not.toThrow();
		});

		it('should deny operations when no permissions', () => {
			const passport = createMockPassport({ canManageMembers: false, isSystemAccount: false });
			const member = new Member(createMemberProps([{ id: 'account-1', statusCode: 'CREATED' } as unknown as MemberAccountProps]), passport);

			expect(() => member.requestActivateMember()).toThrow(PermissionError);
		});
	});

	describe('Event Tracking', () => {
		it('should accumulate multiple events', () => {
			const passport = createMockPassport({ canManageMembers: true });
			const member = new Member(createMemberProps([{ id: 'account-1', statusCode: 'CREATED' } as unknown as MemberAccountProps, { id: 'account-2', statusCode: 'ACCEPTED' } as unknown as MemberAccountProps]), passport);

			member.requestActivateMember();
			member.requestDeactivateMember();

			const events = member.getDomainEvents();
			expect(events).toHaveLength(2);
			expect(events[0]).toBeInstanceOf(MemberActivatedEvent);
			expect(events[1]).toBeInstanceOf(MemberDeactivatedEvent);
		});

		it('should clear events after commit', () => {
			const passport = createMockPassport({ canManageMembers: true });
			const member = new Member(createMemberProps([{ id: 'account-1', statusCode: 'CREATED' } as unknown as MemberAccountProps]), passport);

			member.requestActivateMember();
			expect(member.getDomainEvents()).toHaveLength(1);

			member.clearDomainEvents();
			expect(member.getDomainEvents()).toHaveLength(0);
		});
	});
});
