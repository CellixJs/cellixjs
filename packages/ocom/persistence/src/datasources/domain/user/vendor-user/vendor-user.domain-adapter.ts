import { MongooseSeedwork } from '@cellix/mongoose-seedwork';

import { VendorUser, type VendorUserProps, type Passport, type VendorUserIdentityDetailsProps, type VendorUserContactInformationProps, type VendorUserPersonalInformationProps } from '@ocom/domain';
import type { VendorUser as VendorUserModel, VendorUserContactInformation, VendorUserIdentityDetails, VendorUserPersonalInformation } from '@ocom/data-sources-mongoose-models/user/vendor-user';

export class VendorUserConverter extends MongooseSeedwork.MongoTypeConverter<
	VendorUserModel,
	VendorUserDomainAdapter,
	Passport,
	VendorUser<VendorUserDomainAdapter>
> {
	constructor() {
		super(
			VendorUserDomainAdapter,
			VendorUser,
		);
	}
}

export class VendorUserDomainAdapter
	extends MongooseSeedwork.MongooseDomainAdapter<VendorUserModel>
	implements VendorUserProps
{
	get personalInformation(): VendorUserPersonalInformationProps {
		if (!this.doc.personalInformation) {
			this.doc.set(
				'personalInformation',
				{} as VendorUserPersonalInformation,
			);
		}
		return new VendorUserPersonalInformationDomainAdapter(
			this.doc.personalInformation as VendorUserPersonalInformation,
		);
	}

	get email(): string | undefined {
		return this.doc.email ?? undefined;
	}
	set email(email: string | undefined) {
		this.doc.email = email ?? undefined;
	}

	get displayName(): string {
		return this.doc.displayName ?? '';
	}
	set displayName(displayName: string) {
		this.doc.displayName = displayName;
	}

	get externalId(): string {
		return this.doc.externalId;
	}
	set externalId(externalId: string) {
		this.doc.externalId = externalId;
	}

	get accessBlocked(): boolean {
		return this.doc.accessBlocked ?? false;
	}
	set accessBlocked(accessBlocked: boolean) {
		this.doc.accessBlocked = accessBlocked;
	}

	get tags(): string[] | undefined {
		return (this.doc.tags as string[] | undefined) ?? undefined;
	}
	set tags(tags: string[] | undefined) {
		this.doc.tags = tags;
	}

	get userType(): string {
		return this.doc.userType ?? 'vendor-user';
	}

	override get createdAt(): Date {
		return this.doc.createdAt as Date;
	}

	override get updatedAt(): Date {
		return this.doc.updatedAt as Date;
	}

	override get schemaVersion(): string {
		return this.doc.schemaVersion ?? '1.0.0';
	}
}

export class VendorUserIdentityDetailsDomainAdapter
	implements VendorUserIdentityDetailsProps
{
	private readonly props: VendorUserIdentityDetails;

	constructor(props: VendorUserIdentityDetails) {
		this.props = props;
	}

	get lastName(): string {
		return this.props.lastName ?? '';
	}
	set lastName(lastName: string) {
		this.props.lastName = lastName;
	}

	get legalNameConsistsOfOneName(): boolean {
		return this.props.legalNameConsistsOfOneName ?? false;
	}
	set legalNameConsistsOfOneName(legalNameConsistsOfOneName: boolean) {
		this.props.legalNameConsistsOfOneName = legalNameConsistsOfOneName;
	}

	get restOfName(): string | undefined {
		return this.props.restOfName ?? undefined;
	}
	set restOfName(restOfName: string | undefined) {
		this.props.restOfName = restOfName;
	}
}

export class VendorUserContactInformationDomainAdapter
	implements VendorUserContactInformationProps
{
	private readonly props: VendorUserContactInformation;

	constructor(props: VendorUserContactInformation) {
		this.props = props;
	}

	get email(): string {
		return this.props.email ?? '';
	}
	set email(email: string) {
		this.props.email = email;
	}
}

export class VendorUserPersonalInformationDomainAdapter
	implements VendorUserPersonalInformationProps
{
	private readonly props: VendorUserPersonalInformation;

	constructor(props: VendorUserPersonalInformation) {
		this.props = props;
	}

	get identityDetails(): VendorUserIdentityDetailsProps {
		if (!this.props.identityDetails) {
			this.props.set(
				'identityDetails',
				{} as VendorUserIdentityDetails,
			);
		}
		return new VendorUserIdentityDetailsDomainAdapter(
			this.props.identityDetails as VendorUserIdentityDetails,
		);
	}

	get contactInformation(): VendorUserContactInformationProps {
		if (!this.props.contactInformation) {
			this.props.set(
				'contactInformation',
				{} as VendorUserContactInformation,
			);
		}
		return new VendorUserContactInformationDomainAdapter(
			this.props.contactInformation as VendorUserContactInformation,
		);
	}
}
