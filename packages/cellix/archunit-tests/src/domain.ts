export type { DomainConventionsConfig } from './checks/domain-conventions.js';
export {
	checkAggregateRootConventions,
	checkRepositoryConventions,
	checkUnitOfWorkConventions,
	checkVisaConventions,
} from './checks/domain-conventions.js';

export type { DomainConventionTestsConfig } from './test-suites/domain-conventions.js';
export { describeDomainConventionTests } from './test-suites/domain-conventions.js';
