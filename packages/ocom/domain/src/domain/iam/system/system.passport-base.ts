import type { CaseDomainPermissions } from '../../contexts/case/case.domain-permissions.ts';
import type { CommunityDomainPermissions } from '../../contexts/community/community.domain-permissions.ts';
import type { PropertyDomainPermissions } from '../../contexts/property/property.domain-permissions.ts';
import type { ServiceDomainPermissions } from '../../contexts/service/service.domain-permissions.ts';
import type { UserDomainPermissions } from '../../contexts/user/user.domain-permissions.ts';

export type PermissionsSpec =
	| CaseDomainPermissions
	| CommunityDomainPermissions
	| PropertyDomainPermissions
	| ServiceDomainPermissions
	| UserDomainPermissions;
export abstract class SystemPassportBase {
	protected readonly permissions: Partial<PermissionsSpec>;
	constructor(permissions?: Partial<PermissionsSpec>) {
		this.permissions = permissions ?? {};
	}
}
