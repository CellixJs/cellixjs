import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';
import * as ValueObjects from './video-viewing.value-objects.ts';

const test = { for: describeFeature };
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feature = await loadFeature(path.resolve(__dirname, 'features/video-viewing.value-objects.feature'));

test.for(feature, ({ Scenario }) => {
	Scenario('Creating a reference id', ({ When, Then }) => {
		let value: string;
		When('I create a reference id with "video-1"', () => {
			value = new ValueObjects.ReferenceId('video-1').valueOf();
		});
		Then('the value should be "video-1"', () => {
			expect(value).toBe('video-1');
		});
	});

	Scenario('Rejecting an empty reference id', ({ When, Then }) => {
		let action: () => unknown;
		When('I try to create a reference id with ""', () => {
			action = () => new ValueObjects.ReferenceId('');
		});
		Then('an error should be thrown', () => {
			expect(action).toThrow();
		});
	});

	Scenario('Rejecting a reference id that is too long', ({ When, Then }) => {
		let action: () => unknown;
		When('I try to create a reference id with a string of 65 characters', () => {
			action = () => new ValueObjects.ReferenceId('a'.repeat(65));
		});
		Then('an error should be thrown', () => {
			expect(action).toThrow();
		});
	});

	Scenario('Accepting positions from the start to one day', ({ When, Then }) => {
		let values: number[];
		When('I create positions of 0 and 86400 seconds', () => {
			values = [0, ValueObjects.MaxPositionSeconds].map((seconds) => new ValueObjects.PositionSeconds(seconds).valueOf());
		});
		Then('both positions should be accepted', () => {
			expect(values).toEqual([0, 86400]);
		});
	});

	Scenario('Rejecting a negative position', ({ When, Then }) => {
		let action: () => unknown;
		When('I try to create a position of -1 seconds', () => {
			action = () => new ValueObjects.PositionSeconds(-1);
		});
		Then('an error should be thrown', () => {
			expect(action).toThrow();
		});
	});

	Scenario('Rejecting a position past one day', ({ When, Then }) => {
		let action: () => unknown;
		When('I try to create a position of 86401 seconds', () => {
			action = () => new ValueObjects.PositionSeconds(86401);
		});
		Then('an error should be thrown', () => {
			expect(action).toThrow();
		});
	});
});
