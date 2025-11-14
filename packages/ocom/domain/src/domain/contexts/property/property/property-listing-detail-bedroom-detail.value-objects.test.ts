import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';
import * as ValueObjects from './property-listing-detail-bedroom-detail.value-objects.ts';

const test = { for: describeFeature };
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feature = await loadFeature(
	path.resolve(
		__dirname,
		'features/property-listing-detail-bedroom-detail.value-objects.feature',
	),
);

test.for(feature, ({ Scenario }) => {
	// RoomName
	Scenario('Creating a room name with valid value', ({ When, Then }) => {
		let value: string;
		When('I create a room name with "Master Bedroom"', () => {
			value = new ValueObjects.RoomName('Master Bedroom').valueOf();
		});
		Then('the value should be "Master Bedroom"', () => {
			expect(value).toBe('Master Bedroom');
		});
	});

	Scenario(
		'Creating a room name with leading and trailing whitespace',
		({ When, Then }) => {
			let value: string;
			When('I create a room name with "  Master Bedroom  "', () => {
				value = new ValueObjects.RoomName('  Master Bedroom  ').valueOf();
			});
			Then('the value should be "Master Bedroom"', () => {
				expect(value).toBe('Master Bedroom');
			});
		},
	);

	Scenario(
		'Creating a room name with maximum allowed length',
		({ When, Then }) => {
			let value: string;
			When('I create a room name with a string of 100 characters', () => {
				value = new ValueObjects.RoomName('a'.repeat(100)).valueOf();
			});
			Then('the value should be the 100 character string', () => {
				expect(value).toBe('a'.repeat(100));
			});
		},
	);

	Scenario(
		'Creating a room name with more than maximum allowed length',
		({ When, Then }) => {
			let createRoomNameTooLong: () => void;
			When(
				'I try to create a room name with a string of 101 characters',
				() => {
					createRoomNameTooLong = () => {
						new ValueObjects.RoomName('a'.repeat(101)).valueOf();
					};
				},
			);
			Then(
				'an error should be thrown indicating the room name is too long',
				() => {
					expect(createRoomNameTooLong).toThrow('Too long');
				},
			);
		},
	);

	Scenario(
		'Creating a room name with minimum allowed length',
		({ When, Then }) => {
			let value: string;
			When('I create a room name with a string of 1 character', () => {
				value = new ValueObjects.RoomName('a').valueOf();
			});
			Then('the value should be the 1 character string', () => {
				expect(value).toBe('a');
			});
		},
	);

	Scenario(
		'Creating a room name with less than minimum allowed length',
		({ When, Then }) => {
			let createRoomNameTooShort: () => void;
			When('I try to create a room name with an empty string', () => {
				createRoomNameTooShort = () => {
					new ValueObjects.RoomName('').valueOf();
				};
			});
			Then(
				'an error should be thrown indicating the room name is too short',
				() => {
					expect(createRoomNameTooShort).toThrow('Too short');
				},
			);
		},
	);

	Scenario('Creating a room name with null', ({ When, Then }) => {
		let createRoomNameWithNull: () => void;
		When('I try to create a room name with null', () => {
			createRoomNameWithNull = () => {
				// @ts-expect-error Testing invalid input
				new ValueObjects.RoomName(null).valueOf();
			};
		});
		Then(
			'an error should be thrown indicating the room name is invalid',
			() => {
				expect(createRoomNameWithNull).toThrow('Wrong raw value type');
			},
		);
	});

	// BedDescriptions
	Scenario('Creating bed descriptions with valid array', ({ When, Then }) => {
		let value: string[];
		When('I create bed descriptions with ["King bed", "Queen bed"]', () => {
			value = new ValueObjects.BedDescriptions([
				'King bed',
				'Queen bed',
			]).valueOf();
		});
		Then('the value should be ["King bed", "Queen bed"]', () => {
			expect(value).toEqual(['King bed', 'Queen bed']);
		});
	});

	Scenario('Creating bed descriptions with empty array', ({ When, Then }) => {
		let value: string[];
		When('I create bed descriptions with []', () => {
			value = new ValueObjects.BedDescriptions([]).valueOf();
		});
		Then('the value should be []', () => {
			expect(value).toEqual([]);
		});
	});

	Scenario(
		'Creating bed descriptions with array above maximum length',
		({ When, Then }) => {
			let createBedDescriptionsTooLong: () => void;
			When('I try to create bed descriptions with 21 items', () => {
				createBedDescriptionsTooLong = () => {
					new ValueObjects.BedDescriptions(new Array(21).fill('bed')).valueOf();
				};
			});
			Then(
				'an error should be thrown indicating the bed descriptions array is too long',
				() => {
					expect(createBedDescriptionsTooLong).toThrow('Too long');
				},
			);
		},
	);
});
