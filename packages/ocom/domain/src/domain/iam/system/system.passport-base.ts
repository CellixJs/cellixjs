import type { CommunityDomainPermissions } from '../../contexts/community/community.domain-permissions.ts'
import type { ServiceDomainPermissions } from '../../contexts/service/service.domain-permissions.ts'
import type { UserDomainPermissions } from '../../contexts/user/user.domain-permissions.ts'

export type PermissionsSpec = CommunityDomainPermissions | ServiceDomainPermissions | UserDomainPermissions;
export abstract class SystemPassportBase {
    protected readonly permissions: Partial<PermissionsSpec>;
    constructor(permissions?: Partial<PermissionsSpec>) {
        this.permissions = permissions ?? {};
    }
}
