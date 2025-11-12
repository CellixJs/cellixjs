import type * as DomainSeedwork from '@cellix/domain-seedwork/domain-seedwork';
import type { DomainDataSource } from '../index.ts';
import type { Passport } from './contexts/passport.ts';

export interface DomainExecutionContext
	extends DomainSeedwork.BaseDomainExecutionContext {
	passport: Passport;
    domainDataSource: DomainDataSource;
}
