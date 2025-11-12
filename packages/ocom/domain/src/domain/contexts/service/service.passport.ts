import type { ServiceEntityReference } from './service/service.aggregate.ts';
import type { ServiceVisa } from './service.visa.ts';

export interface ServicePassport {
	forService(root: ServiceEntityReference): ServiceVisa;
}
