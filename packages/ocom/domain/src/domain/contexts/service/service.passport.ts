import type { ServiceVisa } from './service.visa.ts';
import type { ServiceEntityReference } from './service/service.aggregate.ts';

export interface ServicePassport {
	forService(root: ServiceEntityReference): ServiceVisa;
}
