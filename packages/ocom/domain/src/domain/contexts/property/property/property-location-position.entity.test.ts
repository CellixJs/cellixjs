import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';
import * as PropertyLocationPositionEntity from './property-location-position.entity.ts';

const test = { for: describeFeature };
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feature = await loadFeature(
	path.resolve(__dirname, 'features/property-location-position.entity.feature'),
);

test.for(feature, ({ Scenario }) => {
	const validProps: PropertyLocationPositionEntity.PropertyLocationPositionProps =
		{
			type: 'Point',
			coordinates: [-118.2437, 34.0522],
		};

	Scenario(
		'Creating a property location position with valid props',
		({ When, Then }) => {
			let position: PropertyLocationPositionEntity.PropertyLocationPosition;
			When(
				'I create a property location position with valid type and coordinates',
				() => {
					position =
						new PropertyLocationPositionEntity.PropertyLocationPosition(
							validProps,
						);
				},
			);
			Then(
				'the property location position should be created successfully',
				() => {
					expect(position).toBeInstanceOf(
						PropertyLocationPositionEntity.PropertyLocationPosition,
					);
				},
			);
		},
	);

	Scenario('Accessing type property', ({ Given, When, Then }) => {
		let position: PropertyLocationPositionEntity.PropertyLocationPosition;
		Given('a property location position exists', () => {
			position = new PropertyLocationPositionEntity.PropertyLocationPosition(
				validProps,
			);
		});
		When('I access the type property', () => {
			// Access in Then
		});
		Then('it should return the correct type', () => {
			expect(position.type).toBe('Point');
		});
	});

	Scenario('Accessing coordinates property', ({ Given, When, Then }) => {
		let position: PropertyLocationPositionEntity.PropertyLocationPosition;
		Given('a property location position exists', () => {
			position = new PropertyLocationPositionEntity.PropertyLocationPosition(
				validProps,
			);
		});
		When('I access the coordinates property', () => {
			// Access in Then
		});
		Then('it should return the correct coordinates', () => {
			expect(position.coordinates).toEqual([-118.2437, 34.0522]);
		});
	});
});
