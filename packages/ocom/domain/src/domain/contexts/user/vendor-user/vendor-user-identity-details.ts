import { ValueObject } from '@cellix/domain-seedwork/value-object';
import { PermissionError } from '@cellix/domain-seedwork/domain-entity';
import type { ValueObjectProps } from '@cellix/domain-seedwork/value-object';
import type { UserVisa } from '../user.visa.ts';
import * as ValueObjects from './vendor-user.value-objects.ts';

export interface VendorUserIdentityDetailsProps
	extends ValueObjectProps {
	lastName: string;
	legalNameConsistsOfOneName: boolean;
	restOfName: string | undefined;
}

export interface VendorUserIdentityDetailsEntityReference
	extends Readonly<VendorUserIdentityDetailsProps> {}

export class VendorUserIdentityDetails
	extends ValueObject<VendorUserIdentityDetailsProps>
	implements VendorUserIdentityDetailsEntityReference
{
    private isNew: boolean = false;
    private readonly visa: UserVisa;
	constructor(props: VendorUserIdentityDetailsProps, visa: UserVisa) {
		super(props);
		this.visa = visa;
	}

    public static getNewInstance(
        props: VendorUserIdentityDetailsProps,
        visa: UserVisa,
        lastName: string,
        legalNameConsistsOfOneName: boolean,
        restOfName: string | undefined,
    ): VendorUserIdentityDetails {
        const newInstance = new VendorUserIdentityDetails(props, visa);
        newInstance.markAsNew();
        newInstance.lastName = lastName;
        newInstance.legalNameConsistsOfOneName = legalNameConsistsOfOneName;
        newInstance.restOfName = restOfName;
        newInstance.isNew = false;
        return newInstance;
    }

    private markAsNew(): void {
        this.isNew = true;
    }

    private validateVisa(): void {
		if (
			!this.isNew &&
			!this.visa.determineIf(
				(permissions) =>
					permissions.isEditingOwnAccount || permissions.canManageVendorUsers,
			)
		) {
			throw new PermissionError('Cannot set identity details');
		}
	}

	get lastName(): string {
		return this.props.lastName;
	}
	set lastName(lastName: string) {
        this.validateVisa();
		this.props.lastName = new ValueObjects.LastName(lastName).valueOf();
	}

	get legalNameConsistsOfOneName(): boolean {
		return this.props.legalNameConsistsOfOneName;
	}
	set legalNameConsistsOfOneName(legalNameConsistsOfOneName: boolean) {
        this.validateVisa();
		this.props.legalNameConsistsOfOneName = legalNameConsistsOfOneName;
	}

	get restOfName(): string | undefined {
		return this.props.restOfName;
	}
	set restOfName(restOfName: string | undefined) {
        this.validateVisa();
		this.props.restOfName = new ValueObjects.RestOfName(restOfName).valueOf();
	}
}
