import type { ServiceEntityReference } from '../../../contexts/service/service-aggregate.ts';
import type { ServicePassport } from '../../../contexts/service/service.passport.ts';
import type { ServiceVisa } from '../../../contexts/service/service.visa.ts';
import { GuestPassportBase } from '../guest.passport-base.ts';

export class GuestServicePassport
	extends GuestPassportBase
	implements ServicePassport
{
	forService(_root: ServiceEntityReference): ServiceVisa {
		return { determineIf: () => false };
	}
}
