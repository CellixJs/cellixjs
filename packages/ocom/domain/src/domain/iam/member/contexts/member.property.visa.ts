import type { MemberEntityReference } from '../../../contexts/community/member/member.ts';
import { AccountStatusCodes } from '../../../contexts/community/member/member-account.value-objects.ts';
import type { PropertyEntityReference } from '../../../contexts/property/property/property.aggregate.ts';
import type { PropertyDomainPermissions } from '../../../contexts/property/property.domain-permissions.ts';
import type { PropertyVisa } from '../../../contexts/property/property.visa.ts';
import type { EndUserEntityReference } from '../../../contexts/user/end-user/end-user.ts';

export class MemberPropertyVisa<root extends PropertyEntityReference> implements PropertyVisa {
	private readonly root: root;
	private readonly member: MemberEntityReference;
	private readonly user: EndUserEntityReference;

	constructor(root: root, member: MemberEntityReference, user: EndUserEntityReference) {
		this.root = root;
		this.member = member;
		this.user = user;
	}

	determineIf(func: (permissions: Readonly<PropertyDomainPermissions>) => boolean): boolean {
		// deactivated (or not-yet-accepted) accounts must not retain property access
		const actingAccount = this.member.accounts.find((account) => account.user.id === this.user.id);
		if (actingAccount?.statusCode !== AccountStatusCodes.Accepted) {
			return false;
		}

		if (this.member.community.id !== this.root.community.id) {
			return false;
		}

		const { propertyPermissions } = this.member.role.permissions;
		const permissions: PropertyDomainPermissions = {
			canManageProperties: propertyPermissions?.canManageProperties ?? false,
			canEditOwnProperty: propertyPermissions?.canEditOwnProperty ?? false,
			isSystemAccount: false,
			isEditingOwnProperty: Boolean(this.root.owner?.id && this.root.owner.id === this.member.id),
		};

		return func(permissions);
	}
}
