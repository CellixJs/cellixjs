import { ValueObject } from '@cellix/domain-seedwork/value-object';
import type { ValueObjectProps } from '@cellix/domain-seedwork/value-object';
import type { UserVisa } from '../user.visa.ts';
import type { EndUserAggregateRoot } from './end-user.ts';
import {
	EndUserContactInformation,
	type EndUserContactInformationEntityReference,
	type EndUserContactInformationProps,
} from './end-user-contact-information.ts';
import {
	EndUserIdentityDetails,
	type EndUserIdentityDetailsEntityReference,
	type EndUserIdentityDetailsProps,
} from './end-user-identity-details.ts';

export interface EndUserPersonalInformationProps
	extends ValueObjectProps {
	readonly identityDetails: EndUserIdentityDetailsProps;
	readonly contactInformation: EndUserContactInformationProps;
}

export interface EndUserPersonalInformationEntityReference
	extends Readonly<
		Omit<
			EndUserPersonalInformationProps,
			'identityDetails' | 'contactInformation'
		>
	> {
	readonly identityDetails: EndUserIdentityDetailsEntityReference;
	readonly contactInformation: EndUserContactInformationEntityReference;
}

export class EndUserPersonalInformation
		extends ValueObject<EndUserPersonalInformationProps>
		implements EndUserPersonalInformationEntityReference
	{
		private readonly visa: UserVisa;
		private readonly root: EndUserAggregateRoot;
		constructor(
			props: EndUserPersonalInformationProps,
			visa: UserVisa,
			root: EndUserAggregateRoot,
		) {
			super(props);
			this.visa = visa;
			this.root = root;
		}

		get identityDetails() {
			return new EndUserIdentityDetails(
				this.props.identityDetails,
				this.visa,
				this.root,
			);
		}

		get contactInformation() {
			return new EndUserContactInformation(
				this.props.contactInformation,
				this.visa,
				this.root,
			);
		}
	}
