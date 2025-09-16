import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';
import { Community } from './index.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feature = await loadFeature(
  path.resolve(__dirname, 'features/index.feature'),
);

describeFeature(feature, ({ given, when, then }) => {
  let communityExport: typeof Community;

  given('the services index module', () => {
    // Module is already imported
  });

  when('I import the Community export', () => {
    communityExport = Community;
  });

  then('it should export the Community services object', () => {
    expect(communityExport).toBeDefined();
    expect(typeof communityExport).toBe('object');
  });
});