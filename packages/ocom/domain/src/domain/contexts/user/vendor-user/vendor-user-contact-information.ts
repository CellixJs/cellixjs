import { ValueObject } from '@cellix/domain-seedwork/value-object';
import { PermissionError } from '@cellix/domain-seedwork/domain-entity';
import type { ValueObjectProps } from '@cellix/domain-seedwork/value-object';
import type { UserVisa } from '../user.visa.ts';
import { Email } from './vendor-user.value-objects.ts';

export interface VendorUserContactInformationProps
	extends ValueObjectProps {
	email: string;
}

export interface VendorUserContactInformationEntityReference
	extends Readonly<VendorUserContactInformationProps> {}

export class VendorUserContactInformation
	extends ValueObject<VendorUserContactInformationProps>
	implements VendorUserContactInformationEntityReference
{
    private isNew: boolean = false;
    private readonly visa: UserVisa;
	constructor(props: VendorUserContactInformationProps, visa: UserVisa) {
		super(props);
		this.visa = visa;
	}

    public static getNewInstance(
        props: VendorUserContactInformationProps,
        visa: UserVisa,
        email: string,
    ): VendorUserContactInformation {
        const newInstance = new VendorUserContactInformation(props, visa);
        newInstance.markAsNew();
        newInstance.email = email;
        newInstance.isNew = false;
        return newInstance;
    }

    private markAsNew(): void {
        this.isNew = true;
    }
	get email(): string {
		return this.props.email;
	}
	set email(email: string) {
        if (
			!this.isNew &&
			!this.visa.determineIf(
				(permissions) =>
					permissions.isEditingOwnAccount || permissions.canManageVendorUsers,
			)
		) {
			throw new PermissionError('Cannot set email');
		}
		// biome-ignore lint/plugin/no-type-assertion: test file
		this.props.email = new Email(email).valueOf() as string;
	}
}
