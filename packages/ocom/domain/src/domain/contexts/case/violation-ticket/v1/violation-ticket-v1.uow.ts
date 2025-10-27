import type { DomainSeedwork } from '@cellix/domain-seedwork';
import type { Passport } from '../../../passport.ts';
import type { ViolationTicketV1Repository } from './violation-ticket-v1.repository.ts';
import type { ViolationTicketV1, ViolationTicketV1Props } from './violation-ticket-v1.aggregate.ts';

export interface ViolationTicketV1UnitOfWork
	extends DomainSeedwork.UnitOfWork<
		Passport,
		ViolationTicketV1Props,
		ViolationTicketV1<ViolationTicketV1Props>,
		ViolationTicketV1Repository<ViolationTicketV1Props>
	>,
    DomainSeedwork.InitializedUnitOfWork<
        Passport,
        ViolationTicketV1Props,
        ViolationTicketV1<ViolationTicketV1Props>,
        ViolationTicketV1Repository<ViolationTicketV1Props>
    > {}