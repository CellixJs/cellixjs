import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';
import { NotFoundError } from './repository.ts';


const test = { for: describeFeature };
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feature = await loadFeature(
  path.resolve(__dirname, 'features/repository.feature')
);

test.for(feature, ({ Scenario }) => {
  let error: Error | undefined;

  Scenario('Throwing a NotFoundError', ({ When, Then }) => {
    When('a not found error is thrown with a message', () => {
      try {
        throw new NotFoundError('Item not found');
      } catch (e) {
        error = e as Error;
      }
    });
    Then('it should be an instance of Error with the correct name and message', () => {
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(NotFoundError);
      expect(error?.name).toBe('NotFoundError');
      expect(error?.message).toBe('Item not found');
    });
  });
});