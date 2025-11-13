import * as MongooseSeedwork from '@cellix/mongoose-seedwork';
import type { Models } from '@ocom/data-sources-mongoose-models';

import { VendorUser } from '@ocom/domain/contexts/user/vendor-user';
export class VendorUserConverter extends MongooseSeedwork.MongoTypeConverter<
	Models.User.VendorUser,
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
	extends MongooseSeedwork.MongooseDomainAdapter<Models.User.VendorUser>
	implements VendorUserProps
{
	get personalInformation(): VendorUserPersonalInformationProps {
		if (!this.doc.personalInformation) {
			this.doc.set(
				'personalInformation',
				{} as Models.User.VendorUserPersonalInformation,
			);
		}
		return new VendorUserPersonalInformationDomainAdapter(
			this.doc.personalInformation as Models.User.VendorUserPersonalInformation,
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
	private readonly props: Models.User.VendorUserIdentityDetails;

	constructor(props: Models.User.VendorUserIdentityDetails) {
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
	private readonly props: Models.User.VendorUserContactInformation;

	constructor(props: Models.User.VendorUserContactInformation) {
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
	private readonly props: Models.User.VendorUserPersonalInformation;

	constructor(props: Models.User.VendorUserPersonalInformation) {
		this.props = props;
	}

	get identityDetails(): VendorUserIdentityDetailsProps {
		if (!this.props.identityDetails) {
			this.props.set(
				'identityDetails',
				{} as Models.User.VendorUserIdentityDetails,
			);
		}
		return new VendorUserIdentityDetailsDomainAdapter(
			this.props.identityDetails as Models.User.VendorUserIdentityDetails,
		);
	}

	get contactInformation(): VendorUserContactInformationProps {
		if (!this.props.contactInformation) {
			this.props.set(
				'contactInformation',
				{} as Models.User.VendorUserContactInformation,
			);
		}
		return new VendorUserContactInformationDomainAdapter(
			this.props.contactInformation as Models.User.VendorUserContactInformation,
		);
	}
}
