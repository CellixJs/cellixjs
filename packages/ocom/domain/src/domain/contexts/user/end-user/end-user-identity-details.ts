import * as DomainSeedwork from '@cellix/domain-seedwork/domain-seedwork';
import * as ValueObjects from './end-user.value-objects.ts';
import type { UserVisa } from '../user.visa.ts';
import type { EndUserAggregateRoot } from './end-user.ts';

export interface EndUserIdentityDetailsProps
	extends DomainSeedwork.ValueObjectProps {
	lastName: string;
	legalNameConsistsOfOneName: boolean;
	restOfName: string | undefined;
}

export interface EndUserIdentityDetailsEntityReference
	extends Readonly<EndUserIdentityDetailsProps> {}

export class EndUserIdentityDetails
	extends DomainSeedwork.ValueObject<EndUserIdentityDetailsProps>
	implements EndUserIdentityDetailsEntityReference
{
	private readonly visa: UserVisa;
    private readonly root: EndUserAggregateRoot;
	constructor(props: EndUserIdentityDetailsProps, visa: UserVisa, root: EndUserAggregateRoot) {
		super(props);
		this.visa = visa;
        this.root = root;
	}

	private validateVisa(): void {
		if (
			!this.root.isNew &&
			!this.visa.determineIf(
				(permissions) =>
					permissions.isEditingOwnAccount || permissions.canManageEndUsers,
			)
		) {
			throw new DomainSeedwork.PermissionError('Cannot set identity details');
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
