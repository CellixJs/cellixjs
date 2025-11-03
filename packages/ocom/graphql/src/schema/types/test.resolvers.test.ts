import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';
import testResolvers from './test.resolvers.ts';

const test = { for: describeFeature };
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feature = await loadFeature(
  path.resolve(__dirname, 'features/test.resolvers.feature'),
);

test.for(feature, ({ Scenario }) => {
  let result: string;

  Scenario('Responding with hello world', ({ When, Then }) => {
    When('the hello query is executed', () => {
      result = (testResolvers.Query?.hello as () => string)();
    });

    Then('it should return "Hello, world!"', () => {
      expect(result).toBe('Hello, world!');
    });
  });
});
