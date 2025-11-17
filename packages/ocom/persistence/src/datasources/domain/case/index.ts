import type { ModelsContext } from '../../../index.ts';
import { ServiceTicketV1Persistence } from './service-ticket-v1/index.ts';
import type { Passport } from '@ocom/domain/contexts/passport';

export const CaseContextPersistence = (models: ModelsContext, passport: Passport) => ({
    ServiceTicket: {
        V1: ServiceTicketV1Persistence(models, passport),
    },
});