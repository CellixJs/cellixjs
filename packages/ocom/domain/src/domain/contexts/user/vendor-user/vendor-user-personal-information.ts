import * as DomainSeedwork from '@cellix/domain-seedwork/domain-seedwork';
import type { UserVisa } from '../user.visa.ts';
import {
	VendorUserContactInformation,
	type VendorUserContactInformationEntityReference,
	type VendorUserContactInformationProps,
} from './vendor-user-contact-information.ts';
import {
	VendorUserIdentityDetails,
	type VendorUserIdentityDetailsEntityReference,
	type VendorUserIdentityDetailsProps,
} from './vendor-user-identity-details.ts';

export interface VendorUserPersonalInformationProps
	extends DomainSeedwork.ValueObjectProps {
	readonly identityDetails: VendorUserIdentityDetailsProps;
	readonly contactInformation: VendorUserContactInformationProps;
}

export interface VendorUserPersonalInformationEntityReference
	extends Readonly<
		Omit<
			VendorUserPersonalInformationProps,
			'identityDetails' | 'contactInformation'
		>
	> {
	readonly identityDetails: VendorUserIdentityDetailsEntityReference;
	readonly contactInformation: VendorUserContactInformationEntityReference;
}

export class VendorUserPersonalInformation
	extends DomainSeedwork.ValueObject<VendorUserPersonalInformationProps>
	implements VendorUserPersonalInformationEntityReference
{
    private readonly visa: UserVisa;
	constructor(props: VendorUserPersonalInformationProps, visa: UserVisa) {
		super(props);
		this.visa = visa;
	}

	get identityDetails() {
		return new VendorUserIdentityDetails(this.props.identityDetails, this.visa);
	}

	get contactInformation() {
		return new VendorUserContactInformation(this.props.contactInformation, this.visa);
	}
}
