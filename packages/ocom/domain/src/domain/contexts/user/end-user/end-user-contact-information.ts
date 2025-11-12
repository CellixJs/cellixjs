import * as DomainSeedwork from '@cellix/domain-seedwork/domain-seedwork';
import type { UserVisa } from '../user.visa.ts';
import type { EndUserAggregateRoot } from './end-user.ts';
import { Email } from './end-user.value-objects.ts';
export interface EndUserContactInformationProps
	extends DomainSeedwork.ValueObjectProps {
	email: string;
}

export interface EndUserContactInformationEntityReference
	extends Readonly<EndUserContactInformationProps> {}

export class EndUserContactInformation
	extends DomainSeedwork.ValueObject<EndUserContactInformationProps>
	implements EndUserContactInformationEntityReference
{
	private readonly visa: UserVisa;
    private readonly root: EndUserAggregateRoot; 
	public constructor(props: EndUserContactInformationProps, visa: UserVisa, root: EndUserAggregateRoot) {
		super(props);
		this.visa = visa;
        this.root = root;
	}

	public get email(): string {
		return this.props.email;
	}
	public set email(email: string) {
		if (
			!this.root.isNew &&
			!this.visa.determineIf(
				(permissions) =>
					permissions.isEditingOwnAccount || permissions.canManageEndUsers,
			)
		) {
			throw new DomainSeedwork.PermissionError('Cannot set email');
		}
		this.props.email = new Email(email).valueOf() as string;
	}
}
