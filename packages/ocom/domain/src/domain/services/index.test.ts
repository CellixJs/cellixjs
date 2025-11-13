import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';
import { Community } from './index.ts';

const test = { for: describeFeature };
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feature = await loadFeature(
	path.resolve(__dirname, 'features/index.feature'),
);

test.for(feature, ({ Scenario }) => {
	let communityExport: typeof Community;

	Scenario('Exporting Community services', ({ Given, When, Then }) => {
		Given('the services index module', () => {
			// Module is already imported
		});

		When('I import the Community export', () => {
			communityExport = Community;
		});

		Then('it should export the Community services object', () => {
			expect(communityExport).toBeDefined();
			expect(typeof communityExport).toBe('object');
		});
	});
});
