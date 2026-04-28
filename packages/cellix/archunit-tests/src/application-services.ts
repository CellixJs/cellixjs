export type { ApplicationServicesConventionsConfig } from './checks/application-services-conventions.js';
export {
	checkApplicationServicesDependencyBoundaries,
	checkApplicationServicesFactoryPattern,
	checkApplicationServicesIndexComposition,
	checkApplicationServicesQueryPattern,
	checkApplicationServicesTransactionUsage,
} from './checks/application-services-conventions.js';

export type { ApplicationServicesConventionTestsConfig } from './test-suites/application-services-conventions.js';
export { describeApplicationServicesConventionTests } from './test-suites/application-services-conventions.js';
