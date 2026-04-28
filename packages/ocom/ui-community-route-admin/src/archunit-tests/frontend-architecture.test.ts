import { describeFrontendArchitectureTests, type FrontendArchitectureTestsConfig } from '@cellix/archunit-tests/frontend';
import { describeFrontendArchitectureTests as describeOComFrontendArchitectureTests, type FrontendArchitectureTestsConfig as OComFrontendArchitectureTestsConfig } from '@ocom-verification/archunit-tests/frontend';

const cellixConfig: FrontendArchitectureTestsConfig = {
	uiSourcePath: './src',
	testName: 'UI Community Route Admin',
	requiredTopLevelDirectories: ['components'],
	requiredComponentDirectories: [],
	allowedLegacyDirectories: ['pages'],
};

const ocomConfig: OComFrontendArchitectureTestsConfig = {
	uiSourcePath: './src',
	testName: 'UI Community Route Admin',
	allowedContainerPaths: ['section-layout.container.tsx'],
};

describeFrontendArchitectureTests(cellixConfig);
describeOComFrontendArchitectureTests(ocomConfig);
