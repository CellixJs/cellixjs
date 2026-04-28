import { type ApplicationServicesConventionTestsConfig, describeApplicationServicesConventionTests } from '@cellix/archunit-tests/application-services';

import {
	describeApplicationServicesConventionTests as describeOComApplicationServicesConventionTests,
	type ApplicationServicesConventionTestsConfig as OComApplicationServicesConventionTestsConfig,
} from '@ocom-verification/archunit-tests/application-services';

const cellixConfig: ApplicationServicesConventionTestsConfig = {
	applicationServicesGlob: '../application-services/src/contexts/**',
	applicationServicesAllGlob: '../application-services/src/**',
};

const ocomConfig: OComApplicationServicesConventionTestsConfig = {
	applicationServicesGlob: '../application-services/src/contexts/**',
	applicationServicesAllGlob: '../application-services/src/**',
};

describeApplicationServicesConventionTests(cellixConfig);
describeOComApplicationServicesConventionTests(ocomConfig);
