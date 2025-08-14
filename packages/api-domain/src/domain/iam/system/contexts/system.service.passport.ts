
import type { ServiceEntityReference } from '../../../contexts/service/service/service.ts';
import type { ServicePassport } from '../../../contexts/service/service.passport.ts';
import type { ServiceVisa } from '../../../contexts/service/service.visa.ts';
import { SystemPassportBase } from '../system.passport-base.ts';

export class SystemServicePassport
	extends SystemPassportBase
	implements ServicePassport
{
	forService(_root: ServiceEntityReference): ServiceVisa {
		return { determineIf: () => true };
	}
}
