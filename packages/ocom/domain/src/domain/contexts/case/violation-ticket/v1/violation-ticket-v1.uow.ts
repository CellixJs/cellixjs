import type {
	InitializedUnitOfWork,
	UnitOfWork,
} from '@cellix/domain-seedwork/unit-of-work';
import type { Passport } from '../../../passport.ts';
import type {
	ViolationTicketV1,
	ViolationTicketV1Props,
} from './violation-ticket-v1.aggregate.ts';
import type { ViolationTicketV1Repository } from './violation-ticket-v1.repository.ts';

export interface ViolationTicketV1UnitOfWork
	extends UnitOfWork<
			Passport,
			ViolationTicketV1Props,
			ViolationTicketV1<ViolationTicketV1Props>,
			ViolationTicketV1Repository<ViolationTicketV1Props>
		>,
		InitializedUnitOfWork<
			Passport,
			ViolationTicketV1Props,
			ViolationTicketV1<ViolationTicketV1Props>,
			ViolationTicketV1Repository<ViolationTicketV1Props>
		> {}
