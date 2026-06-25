import { MockedProvider, type MockedResponse } from '@apollo/client/testing';
import { HelmetProvider } from '@dr.pogodin/react-helmet';
import { App, ConfigProvider } from 'antd';
import React from 'react';

interface OcomComponentWrapperOptions {
	mocks?: MockedResponse[];
}

export function wrapOcomComponent(options?: OcomComponentWrapperOptions) {
	return (children: React.ReactElement): React.ReactElement =>
		React.createElement(HelmetProvider, null, React.createElement(ConfigProvider, null, React.createElement(App, null, React.createElement(MockedProvider, { mocks: options?.mocks ?? [] }, children))));
}
