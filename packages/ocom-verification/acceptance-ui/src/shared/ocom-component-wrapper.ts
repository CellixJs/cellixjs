import { MockedProvider, type MockedResponse } from '@apollo/client/testing';
import { HelmetProvider } from '@dr.pogodin/react-helmet';
import { App, ConfigProvider } from 'antd';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { type StaffAuth, StaffAuthContext } from '../../../../ocom/ui-staff-shared/src/staff-route-shell.tsx';

interface OcomComponentWrapperOptions {
	mocks?: MockedResponse[];
	/** When provided, wraps children in a MemoryRouter with these initial entries. */
	initialEntries?: string[];
	/** When provided, wraps children in a StaffAuthContext provider. */
	staffAuth?: StaffAuth;
}

export function wrapOcomComponent(options?: OcomComponentWrapperOptions) {
	return (children: React.ReactElement): React.ReactElement => {
		let content: React.ReactElement = children;
		if (options?.initialEntries) {
			content = React.createElement(MemoryRouter, { initialEntries: options.initialEntries }, content);
		}
		if (options?.staffAuth) {
			content = React.createElement(StaffAuthContext.Provider, { value: options.staffAuth }, content);
		}
		return React.createElement(
			HelmetProvider,
			null,
			React.createElement(
				ConfigProvider,
				// Keep antd popups (Select dropdowns, tooltips) inside the rendered
				// container so scoped DOM page adapters can reach them.
				{ getPopupContainer: (trigger?: HTMLElement) => trigger?.parentElement ?? document.body },
				React.createElement(App, null, React.createElement(MockedProvider, { mocks: options?.mocks ?? [] }, content)),
			),
		);
	};
}
