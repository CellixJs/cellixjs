import { DomainSeedwork } from '@cellix/domain-seedwork';
import type { Passport } from '../../passport.ts';
import type { CommunityVisa } from '../community.visa.ts';
import {
    Community,
    type CommunityEntityReference,
} from '../community/community.ts';
import {
    EndUserRole,
    type EndUserRoleEntityReference,
} from '../role/end-user-role/end-user-role.ts';
import {
    MemberAccount,
    type MemberAccountEntityReference,
    type MemberAccountProps,
} from './member-account.ts';
import {
    MemberCustomView,
    type MemberCustomViewEntityReference,
    type MemberCustomViewProps,
} from './member-custom-view.ts';
import {
    MemberProfile,
    type MemberProfileEntityReference,
    type MemberProfileProps,
} from './member-profile.ts';
import * as ValueObjects from './member.value-objects.ts';

export interface MemberProps extends DomainSeedwork.DomainEntityProps {
	memberName: string;
	cybersourceCustomerId: string;
    communityId: string;
	community: Readonly<CommunityEntityReference>;
    loadCommunity: () => Promise<CommunityEntityReference>;
	readonly accounts: DomainSeedwork.PropArray<MemberAccountProps>;
	role: Readonly<EndUserRoleEntityReference>;
    loadRole: () => Promise<EndUserRoleEntityReference>;

	customViews: DomainSeedwork.PropArray<MemberCustomViewProps>;
	readonly profile: MemberProfileProps;

	readonly createdAt: Date;
	readonly updatedAt: Date;
	readonly schemaVersion: string;
}

export interface MemberEntityReference
	extends Readonly<
		Omit<
			MemberProps,
			'community' | 'accounts' | 'role' | 'profile' | 'customViews'
		>
	> {
	readonly community: CommunityEntityReference;
	readonly accounts: ReadonlyArray<MemberAccountEntityReference>;
	readonly role: EndUserRoleEntityReference;
	readonly profile: MemberProfileEntityReference;
	readonly customViews: ReadonlyArray<MemberCustomViewEntityReference>;
}

export class Member<props extends MemberProps>
	extends DomainSeedwork.AggregateRoot<props, Passport>
	implements MemberEntityReference
{
	//#region Fields
	private isNew: boolean = false;
	private _visa?: CommunityVisa;
	//#endregion Fields

	//#region Constructors
    constructor(props: props, passport: Passport) {
        super(props, passport);
        this._visa = passport.community.forCommunity(this.props.community);
    }
	//#endregion Constructors

	//#region Methods
	public static getNewInstance<props extends MemberProps>(
		newProps: props,
		passport: Passport,
		name: string,
		community: CommunityEntityReference,
	): Member<props> {
		if (
			!passport.community
				.forCommunity(community)
				.determineIf(
					(domainPermissions) =>
						domainPermissions.canManageMembers ||
						domainPermissions.isSystemAccount,
				)
		) {
			throw new DomainSeedwork.PermissionError('Cannot create new member');
		}

		const newInstance = new Member(newProps, passport);
		newInstance.isNew = true;
		newInstance.memberName = name;
		newInstance.community = community;
		newInstance.isNew = false;
		return newInstance;
	}

	public requestNewAccount(): MemberAccount {
		if (
			!this.isNew &&
			!this.visa.determineIf(
				(domainPermissions) =>
					domainPermissions.canManageMembers ||
					domainPermissions.isSystemAccount,
			)
		) {
			throw new DomainSeedwork.PermissionError('Cannot set role');
		}
		return new MemberAccount(
			this.props.accounts.getNewItem(),
			this.passport,
			this.visa,
		);
	}

	public requestRemoveAccount(accountRef: MemberAccountProps): void {
		if (
			!this.isNew &&
			!this.visa.determineIf(
				(domainPermissions) =>
					domainPermissions.canManageMembers ||
					domainPermissions.isSystemAccount,
			)
		) {
			throw new DomainSeedwork.PermissionError('Cannot set role');
		}
		this.props.accounts.removeItem(accountRef);
	}

	public requestNewCustomView(): MemberCustomView {
		if (
			!this.isNew &&
			!this.visa.determineIf(
				(domainPermissions) =>
					domainPermissions.canManageMembers ||
					domainPermissions.isSystemAccount,
			)
		) {
			throw new DomainSeedwork.PermissionError('Cannot set custom view');
		}
		return new MemberCustomView(this.props.customViews.getNewItem(), this.visa);
	}

	public requestRemoveCustomView(customView: MemberCustomView): void {
		if (
			!this.isNew &&
			!this.visa.determineIf(
				(domainPermissions) =>
					domainPermissions.canManageMembers ||
					domainPermissions.isSystemAccount,
			)
		) {
			throw new DomainSeedwork.PermissionError('Cannot remove custom view');
		}
		console.log(customView.name);
		this.props.customViews.removeItem(customView.props);
	}
	//#endregion Methods

	//#region Properties
    private get visa(): CommunityVisa {
        if (!this._visa) {
            if (!this.props.community) {
                throw new Error(
                    'Community must be set before computing a visa for Member',
                );
            }
            this._visa = this.passport.community.forCommunity(this.community);
        }
        return this._visa;
    }
	get memberName(): string {
		return this.props.memberName;
	}
	set memberName(memberName: string) {
		if (
			!this.isNew &&
			!this.visa.determineIf(
				(domainPermissions) =>
					domainPermissions.canManageMembers ||
					domainPermissions.isSystemAccount,
			)
		) {
			throw new DomainSeedwork.PermissionError('Cannot set member name');
		}
		this.props.memberName = new ValueObjects.MemberName(memberName).valueOf();
	}

	get cybersourceCustomerId(): string {
		return this.props.cybersourceCustomerId;
	}
	set cybersourceCustomerId(cybersourceCustomerId: string) {
		if (
			!this.isNew &&
			!this.visa.determineIf(
				(domainPermissions) =>
					domainPermissions.canManageMembers ||
					domainPermissions.isSystemAccount,
			)
		) {
			throw new DomainSeedwork.PermissionError(
				'Cannot set cybersource customer id',
			);
		}
		this.props.cybersourceCustomerId = new ValueObjects.CyberSourceCustomerId(
			cybersourceCustomerId,
		).valueOf();
	}
    get communityId(): string {
        return this.props.communityId;
    }
	get community(): CommunityEntityReference {
		return new Community(this.props.community, this.passport);
	}
    async loadCommunity(): Promise<CommunityEntityReference> {
        return await this.props.loadCommunity();
    }
	//TODO: why is this not security checked?
	set community(community: CommunityEntityReference) {
		if (
			!this.isNew &&
			!this.visa.determineIf(
				(domainPermissions) =>
					domainPermissions.canManageMembers ||
					domainPermissions.isSystemAccount,
			)
		) {
			throw new DomainSeedwork.PermissionError('Cannot set community');
		}
		this.props.community = community;
	}

	get accounts(): ReadonlyArray<MemberAccount> {
		return this.props.accounts.items.map(
			(account) => new MemberAccount(account, this.passport, this.visa),
		);
	} // return account as it's an embedded document not a reference (allows editing)

	get role(): EndUserRoleEntityReference {
		return new EndUserRole(this.props.role, this.passport);
	}
    async loadRole(): Promise<EndUserRoleEntityReference> {
        return await this.props.loadRole();
    }
	set role(role: EndUserRoleEntityReference) {
		if (
			!this.isNew &&
			!this.visa.determineIf(
				(domainPermissions) =>
					domainPermissions.canManageMembers ||
					domainPermissions.isSystemAccount,
			)
		) {
			throw new DomainSeedwork.PermissionError('Cannot set role');
		}
		this.props.role = role;
	}

	get profile() {
		return new MemberProfile(this.props.profile, this.visa);
	} // return profile as it's an embedded document not a reference (allows editing)

	get createdAt() {
		return this.props.createdAt;
	}

	get updatedAt() {
		return this.props.updatedAt;
	}

	get schemaVersion() {
		return this.props.schemaVersion;
	}

	get customViews(): ReadonlyArray<MemberCustomView> {
		return this.props.customViews.items.map(
			(customView) => new MemberCustomView(customView, this.visa),
		);
	} // return customView as it's an embedded document not a reference (allows editing)
	// #endregion Properties
}
