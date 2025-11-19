import type {
	InitializedUnitOfWork,
	UnitOfWork,
} from '@cellix/domain-seedwork/unit-of-work';
import type { Passport } from '../../../passport.ts';
import type {
	ServiceTicketV1,
	ServiceTicketV1Props,
} from './service-ticket-v1.aggregate.ts';
import type { ServiceTicketV1Repository } from './service-ticket-v1.repository.ts';

export interface ServiceTicketV1UnitOfWork
	extends UnitOfWork<
			Passport,
			ServiceTicketV1Props,
			ServiceTicketV1<ServiceTicketV1Props>,
			ServiceTicketV1Repository<ServiceTicketV1Props>
		>,
		InitializedUnitOfWork<
			Passport,
			ServiceTicketV1Props,
			ServiceTicketV1<ServiceTicketV1Props>,
			ServiceTicketV1Repository<ServiceTicketV1Props>
		> {}
