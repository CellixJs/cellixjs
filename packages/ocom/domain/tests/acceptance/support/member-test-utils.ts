import type { CommunityEntityReference } from '../../../src/domain/contexts/community/community/community.ts';
import type { EndUserRoleEntityReference } from '../../../src/domain/contexts/community/role/end-user-role/end-user-role.ts';
import type { MemberAccountProps } from '../../../src/domain/contexts/community/member/member-account.ts';
import type { MemberCustomViewProps } from '../../../src/domain/contexts/community/member/member-custom-view.ts';
import type { MemberProfileProps } from '../../../src/domain/contexts/community/member/member-profile.ts';
import type { MemberProps } from '../../../src/domain/contexts/community/member/member.ts';
import type { Passport } from '../../../src/domain/contexts/passport.ts';

type MemberPermissions = {
	canManageMembers?: boolean;
	isSystemAccount?: boolean;
};

function createVisa(permissions: MemberPermissions) {
	return {
		determineIf: (fn: (value: { canManageMembers: boolean; isSystemAccount: boolean }) => boolean) =>
			fn({
				canManageMembers: permissions.canManageMembers ?? true,
				isSystemAccount: permissions.isSystemAccount ?? false,
			}),
	};
}

function createPropArray<T extends { id: string }>(items: T[], createNewItem: () => T) {
	return {
		get items() {
			return items;
		},
		addItem: (item: T) => {
			items.push(item);
		},
		getNewItem: () => createNewItem(),
		removeItem: (item: T) => {
			const index = items.findIndex(({ id }) => id === item.id);
			if (index >= 0) {
				items.splice(index, 1);
			}
		},
		removeAll: () => {
			items.splice(0, items.length);
		},
	};
}

export function createMockPassport(permissions: MemberPermissions = {}): Passport {
	const visa = createVisa(permissions);

	return {
		community: {
			forCommunity: () => visa,
		},
	} as unknown as Passport;
}

export function createMemberProps(accountStatusCode: string = 'CREATED'): MemberProps {
	const accountProps: MemberAccountProps = {
		id: 'account-1',
		firstName: 'Alice',
		lastName: 'Smith',
		user: { id: 'user-1' } as never,
		statusCode: accountStatusCode,
		createdBy: { id: 'creator-1' } as never,
	};

	const customViewProps: MemberCustomViewProps = {
		id: 'custom-view-1',
		name: 'Default View',
		type: 'TABLE',
		filters: [],
		sortOrder: 'ASC',
		columnsToDisplay: [],
	};

	const profileProps: MemberProfileProps = {
		name: 'Test Member',
		email: 'alice@example.com',
		bio: 'Test bio',
		avatarDocumentId: 'avatar-1',
		interests: [],
		showInterests: true,
		showEmail: true,
		showProfile: true,
		showLocation: false,
		showProperties: false,
	};

	return {
		id: 'member-1',
		memberName: 'Test Member',
		cybersourceCustomerId: 'customer-1',
		communityId: 'community-1',
		community: { id: 'community-1' } as CommunityEntityReference,
		loadCommunity: async () => ({ id: 'community-1' } as CommunityEntityReference),
		accounts: createPropArray([accountProps], () => ({
			id: 'account-new',
			firstName: 'New',
			lastName: 'Member',
			user: { id: 'user-new' } as never,
			statusCode: 'CREATED',
			createdBy: { id: 'creator-new' } as never,
		})),
		role: { id: 'role-1' } as EndUserRoleEntityReference,
		loadRole: async () => ({ id: 'role-1' } as EndUserRoleEntityReference),
		customViews: createPropArray<MemberCustomViewProps>([customViewProps], () => ({
			id: 'custom-view-new',
			name: 'New View',
			type: 'TABLE',
			filters: [],
			sortOrder: 'ASC',
			columnsToDisplay: [],
		})),
		profile: profileProps,
		createdAt: new Date('2024-01-01T00:00:00Z'),
		updatedAt: new Date('2024-01-02T00:00:00Z'),
		schemaVersion: '1.0.0',
	};
}
