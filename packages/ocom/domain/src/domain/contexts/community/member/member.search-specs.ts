import { VOString } from '@lucaspaganini/value-objects';

/**
 * Search specifications for Member queries
 * Encapsulates business logic for filtering and searching members
 */

export class MemberSearchName extends VOString({
	trim: true,
	maxLength: 200,
}) {
	constructor(value?: string) {
		super(value || '');
	}

	public static create(name?: string): MemberSearchName {
		return new MemberSearchName(name);
	}

	public isEmpty(): boolean {
		return this.valueOf() === '';
	}

	public override toString(): string {
		return this.valueOf();
	}

	public matches(memberName: string, searchFields?: { profile?: { displayName?: string } }): boolean {
		if (this.isEmpty()) return true;

		const searchTerm = this.valueOf().toLowerCase();
		const nameMatches = memberName.toLowerCase().includes(searchTerm);
		const displayNameMatches = searchFields?.profile?.displayName?.toLowerCase().includes(searchTerm) ?? false;

		return nameMatches || displayNameMatches;
	}
}

export class MemberSearchEmail extends VOString({
	trim: true,
	maxLength: 200,
}) {
	constructor(value?: string) {
		super(value || '');
	}

	public static create(email?: string): MemberSearchEmail {
		return new MemberSearchEmail(email);
	}

	public isEmpty(): boolean {
		return this.valueOf() === '';
	}

	public override toString(): string {
		return this.valueOf();
	}

	public matches(memberAccounts: { emailAddress: string }[]): boolean {
		if (this.isEmpty()) return true;

		const searchTerm = this.valueOf().toLowerCase();
		return memberAccounts.some((account) => account.emailAddress.toLowerCase().includes(searchTerm));
	}
}

export type MemberStatusFilter = 'all' | 'active' | 'inactive';
export type MemberRoleFilter = 'all' | string; // specific role ID or 'all'

export class MemberSearchSpec {
	public readonly name: MemberSearchName;
	public readonly email: MemberSearchEmail;
	public readonly status: MemberStatusFilter;
	public readonly role: MemberRoleFilter;

	constructor(name: MemberSearchName = MemberSearchName.create(), email: MemberSearchEmail = MemberSearchEmail.create(), status: MemberStatusFilter = 'all', role: MemberRoleFilter = 'all') {
		this.name = name;
		this.email = email;
		this.status = status;
		this.role = role;
	}

	public static create(criteria: { name?: string; email?: string; status?: MemberStatusFilter; role?: MemberRoleFilter } = {}): MemberSearchSpec {
		return new MemberSearchSpec(MemberSearchName.create(criteria.name), MemberSearchEmail.create(criteria.email), criteria.status ?? 'all', criteria.role ?? 'all');
	}

	public isEmpty(): boolean {
		return this.name.isEmpty() && this.email.isEmpty() && this.status === 'all' && this.role === 'all';
	}

	public matches(member: { memberName: string; profile?: { name?: string }; accounts: { emailAddress: string; isActive: boolean }[]; role: { id: string } }): boolean {
		// Name/display name match
		const profileSearch = member.profile?.name ? { profile: { displayName: member.profile.name } } : {};
		if (!this.name.matches(member.memberName, profileSearch)) {
			return false;
		}

		// Email match
		if (!this.email.matches(member.accounts)) {
			return false;
		}

		// Status filter
		if (this.status !== 'all') {
			const hasActiveAccount = member.accounts.some((account) => account.isActive);
			const isActive = this.status === 'active';
			if (hasActiveAccount !== isActive) {
				return false;
			}
		}

		// Role filter
		if (this.role !== 'all') {
			if (member.role.id !== this.role) {
				return false;
			}
		}

		return true;
	}

	public toQueryCriteria(): {
		nameSearch?: string;
		emailSearch?: string;
		statusFilter?: MemberStatusFilter;
		roleFilter?: MemberRoleFilter;
	} {
		return {
			...(this.name.isEmpty() ? {} : { nameSearch: this.name.valueOf() }),
			...(this.email.isEmpty() ? {} : { emailSearch: this.email.valueOf() }),
			...(this.status === 'all' ? {} : { statusFilter: this.status }),
			...(this.role === 'all' ? {} : { roleFilter: this.role }),
		};
	}
}
