import type { PropertyVisa } from '../../../contexts/property/property.visa.ts';
import type { PropertyDomainPermissions } from '../../../contexts/property/property.domain-permissions.ts';
import type { PropertyEntityReference } from '../../../contexts/property/property/property.aggregate.ts';
import type { MemberEntityReference } from '../../../contexts/community/member/member.ts';

export class MemberPropertyVisa<root extends PropertyEntityReference>
	implements PropertyVisa
{
	private readonly root: root;
	private readonly member: MemberEntityReference;

	constructor(root: root, member: MemberEntityReference) {
		this.root = root;
		this.member = member;
	}

	determineIf(
		func: (permissions: Readonly<PropertyDomainPermissions>) => boolean,
	): boolean {
		if (this.member.community.id !== this.root.community.id) {
			return false;
		}

		const { propertyPermissions } = this.member.role.permissions;
		const permissions: PropertyDomainPermissions = {
			canManageProperties: propertyPermissions?.canManageProperties ?? false,
			canEditOwnProperty: propertyPermissions?.canEditOwnProperty ?? false,
			isSystemAccount: false,
			isEditingOwnProperty:
				Boolean(this.root.owner?.id && this.root.owner.id === this.member.id),
		};

		return func(permissions);
	}
}
