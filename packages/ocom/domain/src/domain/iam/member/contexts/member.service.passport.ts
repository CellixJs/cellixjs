import type { ServiceEntityReference } from '../../../contexts/service/service-aggregate.ts';
import type { ServicePassport } from '../../../contexts/service/service.passport.ts';
import type { ServiceVisa } from '../../../contexts/service/service.visa.ts';
import { MemberPassportBase } from '../member.passport-base.ts';
import { MemberServiceVisa } from './member.service.visa.ts';

export class MemberServicePassport
	extends MemberPassportBase
	implements ServicePassport
{
	forService(root: ServiceEntityReference): ServiceVisa {
		return new MemberServiceVisa(root, this._member);
	}
}
