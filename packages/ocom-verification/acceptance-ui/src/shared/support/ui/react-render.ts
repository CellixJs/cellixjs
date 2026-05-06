import { MockedProvider, type MockedResponse } from '@apollo/client/testing';
import { HelmetProvider } from '@dr.pogodin/react-helmet';
import { type RenderResult, render } from '@testing-library/react';
import { App, ConfigProvider } from 'antd';
import React from 'react';

let rendered: RenderResult | null = null;

export interface MountOptions {
	mocks?: MockedResponse[];
}

export function mountComponent(ui: React.ReactElement, options?: MountOptions): RenderResult {
	unmountComponent();

	const wrapped = React.createElement(HelmetProvider, null, React.createElement(ConfigProvider, null, React.createElement(App, null, React.createElement(MockedProvider, { mocks: options?.mocks ?? [] }, ui))));

	rendered = render(wrapped);
	return rendered;
}

export function unmountComponent(): void {
	if (rendered) {
		rendered.unmount();
		rendered = null;
	}
}

export function getRendered(): RenderResult | null {
	return rendered;
}
