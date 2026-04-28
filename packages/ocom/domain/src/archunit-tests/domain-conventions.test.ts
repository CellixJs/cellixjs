import { type DomainConventionTestsConfig, describeDomainConventionTests } from '@cellix/archunit-tests/domain';

import { describeDomainConventionTests as describeOComDomainConventionTests, type DomainConventionTestsConfig as OComDomainConventionTestsConfig } from '@ocom-verification/archunit-tests/domain';

const cellixConfig: DomainConventionTestsConfig = {
	domainContextsGlob: '../domain/src/domain/contexts/**',
};

const ocomConfig: OComDomainConventionTestsConfig = {
	domainContextsGlob: '../domain/src/domain/contexts/**',
};

describeDomainConventionTests(cellixConfig);
describeOComDomainConventionTests(ocomConfig);
