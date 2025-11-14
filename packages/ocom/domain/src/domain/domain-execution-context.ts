import type { BaseDomainExecutionContext } from '@cellix/domain-seedwork/base-domain-execution-context';
import type { DomainDataSource } from '../index.ts';
import type { Passport } from './contexts/passport.ts';

export interface DomainExecutionContext
	extends BaseDomainExecutionContext {
	passport: Passport;
    domainDataSource: DomainDataSource;
}
