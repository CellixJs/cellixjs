import { DomainSeedwork } from '@cellix/domain-seedwork';
import { Email } from './vendor-user.value-objects.ts';
import type { UserVisa } from '../user.visa.ts';

export interface VendorUserContactInformationProps
	extends DomainSeedwork.ValueObjectProps {
	email: string;
}

export interface VendorUserContactInformationEntityReference
	extends Readonly<VendorUserContactInformationProps> {}

export class VendorUserContactInformation
	extends DomainSeedwork.ValueObject<VendorUserContactInformationProps>
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
			throw new DomainSeedwork.PermissionError('Cannot set email');
		}
		this.props.email = new Email(email).valueOf() as string;
	}
}
