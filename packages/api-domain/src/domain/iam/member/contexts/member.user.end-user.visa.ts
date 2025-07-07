import type { MemberEntityReference } from '../../../contexts/community/member/member.ts';
import type { EndUserEntityReference } from '../../../contexts/user/end-user/end-user.ts';
import type { UserDomainPermissions } from '../../../contexts/user/user.domain-permissions.ts';
import type { UserVisa } from '../../../contexts/user/user.visa.ts';

export class MemberUserEndUserVisa<root extends EndUserEntityReference> implements UserVisa {
  //biome-ignore lint:noUsedVars
  private readonly root: root;

  constructor(root: root, _member: MemberEntityReference) {
    this.root = root;
  }

  determineIf(func: (permissions: Readonly<UserDomainPermissions>) => boolean): boolean {
    const updatedPermissions: UserDomainPermissions = {
      canManageEndUsers: false,
      canManageStaffRolesAndPermissions: false,
      canManageStaffUsers: false,
      canManageVendorUsers: false,
      isEditingOwnAccount: false,
      isSystemAccount: false
    };

    return func(updatedPermissions);
  }
}
