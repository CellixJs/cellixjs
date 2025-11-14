import type { DomainEntityProps, PermissionError } from '@cellix/domain-seedwork/domain-entity';
import { AggregateRoot } from '@cellix/domain-seedwork/aggregate-root';
import { VendorUserCreatedEvent, type VendorUserCreatedProps } from '../../../events/types/vendor-user-created.ts';
import * as ValueObjects from './vendor-user.value-objects.ts';
import {
	VendorUserPersonalInformation,
	type VendorUserPersonalInformationEntityReference,
	type VendorUserPersonalInformationProps,
} from './vendor-user-personal-information.ts';
import type { Passport } from '../../passport.ts';
import type { UserVisa } from '../user.visa.ts';

export interface VendorUserProps extends DomainEntityProps {
	readonly personalInformation: VendorUserPersonalInformationProps;

	email: string | undefined;
	displayName: string;
	externalId: string;
	accessBlocked: boolean;
	tags: string[] | undefined;
	readonly userType: string;
	readonly createdAt: Date;
	readonly updatedAt: Date;
	readonly schemaVersion: string;
}

export interface VendorUserEntityReference
	extends Readonly<Omit<VendorUserProps, 'personalInformation'>> {
	readonly personalInformation: VendorUserPersonalInformationEntityReference;
}

export class VendorUser<props extends VendorUserProps>
	extends AggregateRoot<props, Passport>
	implements VendorUserEntityReference
{
	private isNew: boolean = false;
	private readonly visa: UserVisa;

	constructor(props: props, passport: Passport) {
		super(props, passport);
		this.visa = passport.user.forVendorUser(this);
	}

	public static getNewUser<props extends VendorUserProps>(
		newProps: props,
		passport: Passport,
		externalId: string,
		lastName: string,
		restOfName?: string,
	): VendorUser<props> {
		newProps.externalId = externalId;
		const user = new VendorUser(newProps, passport);
		user.markAsNew();
		user.externalId = externalId;

		const { identityDetails } = user.personalInformation;

		if (restOfName !== undefined) {
			identityDetails.restOfName = restOfName;
			identityDetails.legalNameConsistsOfOneName = false;
			user.displayName = `${restOfName} ${lastName}`;
		} else {
			identityDetails.legalNameConsistsOfOneName = true;
			user.displayName = lastName;
		}
		identityDetails.lastName = lastName;
		user.isNew = false;
		return user;
	}

	private markAsNew(): void {
		this.isNew = true;
		this.addIntegrationEvent<VendorUserCreatedProps, VendorUserCreatedEvent>(VendorUserCreatedEvent, { userId: this.props.id });
	}

	private validateVisa(): void {
		if (
			!this.isNew &&
			!this.visa.determineIf(
				(permissions) =>
					permissions.canManageVendorUsers || permissions.isEditingOwnAccount,
			)
		) {
			throw new PermissionError('Unauthorized');
		}
	}
	private validateVisaElevated(): void {
		if (
			!this.isNew &&
			!this.visa.determineIf((permissions) => permissions.canManageVendorUsers)
		) {
			throw new Error('Unauthorized');
		}
	}

	get personalInformation() {
		return new VendorUserPersonalInformation(this.props.personalInformation, this.visa);
	}

	get userType(): string  {
		return this.props.userType;
	}

	get email(): string | undefined {
		return this.props.email;
	}
	set email(email: string | undefined) {
		this.props.email = new ValueObjects.Email(email).valueOf();
	}

	get displayName(): string {
		return this.props.displayName;
	}
	set displayName(displayName: string) {
		this.validateVisa();
		this.props.displayName = new ValueObjects.DisplayName(
			displayName,
		).valueOf();
	}

	get externalId(): string {
		return this.props.externalId;
	}
	set externalId(externalId: string) {
		this.validateVisaElevated();
		this.props.externalId = new ValueObjects.ExternalId(externalId).valueOf();
	}

	get accessBlocked(): boolean {
		return this.props.accessBlocked;
	}
	set accessBlocked(accessBlocked: boolean) {
		this.validateVisaElevated();
		this.props.accessBlocked = accessBlocked;
	}

	get tags(): string[] | undefined {
		return this.props.tags;
	}
	set tags(tags: string[] | undefined) {
		this.validateVisaElevated();
		this.props.tags = tags;
	}

	get updatedAt(): Date {
		return this.props.updatedAt;
	}
	get createdAt(): Date {
		return this.props.createdAt;
	}
	get schemaVersion(): string {
		return this.props.schemaVersion;
	}
}
