import { DomainSeedwork } from '@cellix/domain-seedwork';
import type { CommunityVisa } from '../community.visa.ts';
import * as ValueObjects from './member-profile.value-objects.ts';

export interface MemberProfileProps extends DomainSeedwork.ValueObjectProps {
	name: string;
	email: string;
	bio: string;
	avatarDocumentId: string;
	interests: string[];
	showInterests: boolean;
	showEmail: boolean;
	showProfile: boolean;
	showLocation: boolean;
	showProperties: boolean;
}

export interface MemberProfileEntityReference
	extends Readonly<MemberProfileProps> {}

export class MemberProfile
	extends DomainSeedwork.ValueObject<MemberProfileProps>
	implements MemberProfileEntityReference
{
	//#region Fields
	private readonly visa: CommunityVisa;
	//#endregion Fields

	//#region Constructors
	constructor(props: MemberProfileProps, visa: CommunityVisa) {
		super(props);
		this.visa = visa;
	}
	//#endregion Constructors

	//#region Methods
	private validateVisa() {
		if (
			!this.visa.determineIf(
				(domainPermissions) =>
					domainPermissions.canManageMembers ||
					(domainPermissions.canEditOwnMemberProfile &&
						domainPermissions.isEditingOwnMemberAccount),
			)
		) {
			throw new DomainSeedwork.PermissionError(
				'You do not have permission to update this profile',
			);
		}
	}
	//#endregion Methods

	//#region Properties
	get name(): string {
		return this.props.name;
	}
	set name(name: string) {
		this.validateVisa();
		this.props.name = new ValueObjects.Name(name).valueOf();
	}

	get email(): string {
		return this.props.email;
	}
	set email(email: string) {
		this.validateVisa();
		this.props.email = new ValueObjects.NullableEmail(email).valueOf();
	}

	get bio(): string {
		return this.props.bio;
	}
	set bio(bio: string) {
		this.validateVisa();
		this.props.bio = new ValueObjects.Bio(bio).valueOf();
	}

	get avatarDocumentId(): string {
		return this.props.avatarDocumentId;
	}
	set avatarDocumentId(avatarDocumentId: string) {
		this.validateVisa();
		this.props.avatarDocumentId = avatarDocumentId;
	}

	get interests(): string[] {
		return this.props.interests;
	}
	set interests(interests: string[]) {
		this.validateVisa();
		this.props.interests = new ValueObjects.Interests(interests).valueOf();
	}

	get showInterests(): boolean {
		return this.props.showInterests;
	}
	set showInterests(showInterests: boolean) {
		this.validateVisa();
		this.props.showInterests = showInterests;
	}

	get showEmail(): boolean {
		return this.props.showEmail;
	}
	set showEmail(showEmail: boolean) {
		this.validateVisa();
		this.props.showEmail = showEmail;
	}

	get showProfile(): boolean {
		return this.props.showProfile;
	}
	set showProfile(showProfile: boolean) {
		this.validateVisa();
		this.props.showProfile = showProfile;
	}

	get showLocation(): boolean {
		return this.props.showLocation;
	}
	set showLocation(showLocation: boolean) {
		this.validateVisa();
		this.props.showLocation = showLocation;
	}

	get showProperties(): boolean {
		return this.props.showProperties;
	}
	set showProperties(showProperties: boolean) {
		this.validateVisa();
		this.props.showProperties = showProperties;
	}
	//#endregion Properties
}
