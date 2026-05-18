import { describePersistenceConventionTests, type PersistenceConventionTestsConfig } from '@cellix/archunit-tests/persistence';

import { describePersistenceConventionTests as describeOComPersistenceConventionTests, type PersistenceConventionTestsConfig as OComPersistenceConventionTestsConfig } from '@ocom-verification/archunit-tests/persistence';

const cellixConfig: PersistenceConventionTestsConfig = {
	persistenceDomainGlob: '../persistence/src/datasources/domain/**',
	persistenceReadonlyGlob: '../persistence/src/datasources/readonly/**',
	persistenceAllGlob: '../persistence/src/**',
};

const ocomConfig: OComPersistenceConventionTestsConfig = {
	persistenceDomainGlob: '../persistence/src/datasources/domain/**',
	persistenceReadonlyGlob: '../persistence/src/datasources/readonly/**',
	persistenceAllGlob: '../persistence/src/**',
};

describePersistenceConventionTests(cellixConfig);
describeOComPersistenceConventionTests(ocomConfig);
