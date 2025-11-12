import { Passport } from '@ocom/domain';
import type { Models } from '@ocom/data-sources-mongoose-models';
import * as MongooseSeedwork from '@cellix/mongoose-seedwork';

export class EndUserConverter extends MongooseSeedwork.MongoTypeConverter<
	Models.User.EndUser,
	EndUserDomainAdapter,
	Domain.Passport,
	Domain.Contexts.User.EndUser.EndUser<EndUserDomainAdapter>
> {
	constructor() {
		super(
			EndUserDomainAdapter,
			Domain.Contexts.User.EndUser.EndUser<EndUserDomainAdapter>
		);
	}
}

export class EndUserDomainAdapter
	extends MongooseSeedwork.MongooseDomainAdapter<Models.User.EndUser>
	implements Domain.Contexts.User.EndUser.EndUserProps
{
	get userType() {
		return this.doc.userType;
	}

	get externalId() {
		return this.doc.externalId;
	}
	set externalId(externalId) {
		this.doc.externalId = externalId;
	}

	get personalInformation() {
		if (!this.doc.personalInformation) {
		  this.doc.set('personalInformation', {});
		}
		return new EndUserPersonalInformationDomainAdapter(
			this.doc.personalInformation,
		);
	}

	get email() {
		return this.doc.email;
	}
	set email(email) {
		this.doc.email = email;
	}

	get displayName() {
		return this.doc.displayName;
	}
	set displayName(displayName) {
		this.doc.displayName = displayName;
	}

	get accessBlocked() {
		return this.doc.accessBlocked;
	}
	set accessBlocked(accessBlocked) {
		this.doc.accessBlocked = accessBlocked;
	}

	get tags() {
		return this.doc.tags;
	}
	set tags(tags) {
		this.doc.tags = tags;
	}
}

export class EndUserPersonalInformationDomainAdapter
	implements Domain.Contexts.User.EndUser.EndUserPersonalInformationProps
{
	private readonly props: Models.User.EndUserPersonalInformation;
	constructor(props: Models.User.EndUserPersonalInformation) {
		this.props = props;
	}

	get identityDetails() {
		if (!this.props.identityDetails) {
		  this.props.set('identityDetails', {});
		}
		return new EndUserIdentityDetailsDomainAdapter(this.props.identityDetails);
	}

	get contactInformation() {
		if (!this.props.contactInformation) {
		  this.props.set('contactInformation', {});
		}
		return new EndUserContactInformationDomainAdapter(
			this.props.contactInformation,
		);
	}
}

export class EndUserIdentityDetailsDomainAdapter
	implements Domain.Contexts.User.EndUser.EndUserIdentityDetailsProps
{
	private readonly props: Models.User.EndUserIdentityDetails;
	constructor(props: Models.User.EndUserIdentityDetails) {
		this.props = props;
	}

	get lastName() {
		return this.props.lastName;
	}
	set lastName(lastName: string) {
		this.props.lastName = lastName;
	}

	get legalNameConsistsOfOneName() {
		return this.props.legalNameConsistsOfOneName;
	}
	set legalNameConsistsOfOneName(legalNameConsistsOfOneName: boolean) {
		this.props.legalNameConsistsOfOneName = legalNameConsistsOfOneName;
	}

	get restOfName(): string | undefined {
		return this.props.restOfName;
	}
	set restOfName(restOfName: string | undefined) {
		this.props.restOfName = restOfName;
	}
}

export class EndUserContactInformationDomainAdapter
	implements Domain.Contexts.User.EndUser.EndUserContactInformationProps
{
	private readonly props: Models.User.EndUserContactInformation;
	constructor(props: Models.User.EndUserContactInformation) {
		this.props = props;
	}

	get email() {
		return this.props.email;
	}
	set email(email: string) {
		this.props.email = email;
	}
}
