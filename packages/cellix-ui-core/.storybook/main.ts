import { dirname, join } from 'node:path';
import type { StorybookConfig } from '@storybook/react-vite';

function getAbsolutePath(value: string) {
  return dirname(require.resolve(join(value, 'package.json')));
}

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
  addons: [
    getAbsolutePath('@chromatic-com/storybook'),
    getAbsolutePath('@storybook/addon-docs'),
    getAbsolutePath('@storybook/addon-onboarding'),
    getAbsolutePath('@storybook/addon-a11y'),
    getAbsolutePath('@storybook/addon-vitest')
  ],
  framework: {
    name: getAbsolutePath('@storybook/react-vite'),
    options: {}
  }
};

export default config;
