import { describeUiAppCompositionTests } from '@cellix/archunit-tests/ui-app';

describeUiAppCompositionTests({
	appRoot: 'src',
	requiredProviders: ['React.StrictMode', 'ThemeProvider', 'ConfigProvider', 'AntdApp', 'HelmetProvider', 'BrowserRouter', 'AuthProvider'],
});
