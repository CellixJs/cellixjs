// Global preview for Storybook in @ocom/ui-components
// Import Ant Design base styles so components render correctly
import { MockedProvider } from '@apollo/client/testing';
import type { Decorator, Parameters } from '@storybook/react';
import { MemoryRouter } from 'react-router-dom';
import 'antd/dist/reset.css';

// Global MemoryRouter so any Link/useLocation has context
export const decorators: Decorator[] = [
  (Story, context) => {
    const initialEntries = context.parameters?.memoryRouter?.initialEntries ?? ["/"];
    return (
      <MemoryRouter initialEntries={initialEntries}>
        <Story />
      </MemoryRouter>
    );
  },
];

// Global parameters
export const parameters: Parameters = {
	layout: 'padded',
	actions: { argTypesRegex: '^on[A-Z].*' },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    apolloClient: {
        MockedProvider,
    }
};