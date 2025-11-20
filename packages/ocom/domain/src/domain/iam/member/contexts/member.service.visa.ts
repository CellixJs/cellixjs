import type { MemberEntityReference } from '../../../contexts/community/member.ts';
import type { ServiceEntityReference } from '../../../contexts/service/service-aggregate.ts';
import type { ServiceDomainPermissions } from '../../../contexts/service/service.domain-permissions.ts';
import type { ServiceVisa } from '../../../contexts/service/service.visa.ts';

export class MemberServiceVisa<root extends ServiceEntityReference>
	implements ServiceVisa
{
	private readonly root: root;
	private readonly member: MemberEntityReference;

	constructor(root: root, member: MemberEntityReference) {
		this.root = root;
		this.member = member;
	}

	determineIf(
		func: (permissions: ServiceDomainPermissions) => boolean,
	): boolean {
		//ensure that the member is a member of this community
		if (this.member.community.id !== this.root.community.id) {
			console.log(
				'Service Visa : member is not a member of this community',
				this.member,
				this.root,
			);
			return false;
		}

		const { servicePermissions } = this.member.role.permissions;
		// [NN] [ESLINT] commenting this out to follow ESLint rule @typescript-eslint/no-unnecessary-condition
		// if (!servicePermissions) {
		//   console.log("Service Visa : no services permissions");
		//   return false;
		// }

		const updatedPermissions: ServiceDomainPermissions = {
			...servicePermissions, //using spread here to ensure that we get type safety and we don't need to deep copy
			isSystemAccount: false,
		};

		return func(updatedPermissions);
	}
}
