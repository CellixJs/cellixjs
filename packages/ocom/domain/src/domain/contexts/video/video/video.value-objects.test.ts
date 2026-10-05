import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';
import * as ValueObjects from './video.value-objects.ts';

const test = { for: describeFeature };
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feature = await loadFeature(path.resolve(__dirname, 'features/video.value-objects.feature'));

test.for(feature, ({ Scenario }) => {
	Scenario('Creating a title trims whitespace', ({ When, Then }) => {
		let value: string;
		When('I create a title with "  Board meeting  "', () => {
			value = new ValueObjects.Title('  Board meeting  ').valueOf();
		});
		Then('the value should be "Board meeting"', () => {
			expect(value).toBe('Board meeting');
		});
	});

	Scenario('Creating a title that is too long', ({ When, Then }) => {
		let action: () => unknown;
		When('I try to create a title with a string of 201 characters', () => {
			action = () => new ValueObjects.Title('a'.repeat(201));
		});
		Then('an error should be thrown', () => {
			expect(action).toThrow();
		});
	});

	Scenario('Creating a status from a known status', ({ When, Then }) => {
		let value: string;
		When('I create a status with "ENCODING"', () => {
			value = new ValueObjects.Status('ENCODING').valueOf();
		});
		Then('the value should be "ENCODING"', () => {
			expect(value).toBe('ENCODING');
		});
	});

	Scenario('Creating a status from an unknown status', ({ When, Then }) => {
		let action: () => unknown;
		When('I try to create a status with "DELETED"', () => {
			action = () => new ValueObjects.Status('DELETED');
		});
		Then('an error should be thrown', () => {
			expect(action).toThrow();
		});
	});

	Scenario('Accepting the supported video content types', ({ When, Then }) => {
		let values: string[];
		When('I create content types "video/mp4", "video/quicktime", and "video/webm"', () => {
			values = ['video/mp4', 'video/quicktime', 'video/webm'].map((type) => new ValueObjects.ContentType(type).valueOf());
		});
		Then('each value should be accepted', () => {
			expect(values).toEqual(['video/mp4', 'video/quicktime', 'video/webm']);
		});
	});

	Scenario('Rejecting an unsupported content type', ({ When, Then }) => {
		let action: () => unknown;
		When('I try to create a content type with "application/octet-stream"', () => {
			action = () => new ValueObjects.ContentType('application/octet-stream');
		});
		Then('an error should be thrown', () => {
			expect(action).toThrow();
		});
	});

	Scenario('Accepting a size at the 2 GiB limit', ({ When, Then }) => {
		let value: number;
		When('I create a size of 2147483648 bytes', () => {
			value = new ValueObjects.SizeBytes(2147483648).valueOf();
		});
		Then('the value should be 2147483648', () => {
			expect(value).toBe(ValueObjects.MaxVideoSizeBytes);
		});
	});

	Scenario('Rejecting an empty or fractional size', ({ When, Then }) => {
		let actions: (() => unknown)[];
		When('I try to create sizes of 0 and 1.5 bytes', () => {
			actions = [0, 1.5].map((size) => () => new ValueObjects.SizeBytes(size));
		});
		Then('each attempt should throw an error', () => {
			for (const action of actions) expect(action).toThrow();
		});
	});

	Scenario('Accepting a valid container name', ({ When, Then }) => {
		let value: string;
		When('I create a container name with "videos-community-1"', () => {
			value = new ValueObjects.ContainerName('videos-community-1').valueOf();
		});
		Then('the value should be "videos-community-1"', () => {
			expect(value).toBe('videos-community-1');
		});
	});

	Scenario('Rejecting invalid container names', ({ When, Then }) => {
		let actions: (() => unknown)[];
		When('I try to create container names "Videos", "ab", "videos--community", and "-videos"', () => {
			actions = ['Videos', 'ab', 'videos--community', '-videos'].map((name) => () => new ValueObjects.ContainerName(name));
		});
		Then('each attempt should throw an error', () => {
			for (const action of actions) expect(action).toThrow();
		});
	});

	Scenario('Requiring a trailing slash on the output prefix', ({ When, Then }) => {
		let accepted: string;
		let rejected: () => unknown;
		When('I create an output prefix with "video-1/" and try one with "video-1"', () => {
			accepted = new ValueObjects.OutputPrefix('video-1/').valueOf();
			rejected = () => new ValueObjects.OutputPrefix('video-1');
		});
		Then('the first should be accepted and the second should throw an error', () => {
			expect(accepted).toBe('video-1/');
			expect(rejected).toThrow();
		});
	});

	Scenario('Accepting rendition heights', ({ When, Then }) => {
		let value: number[];
		When('I create rendition heights with 1080, 720, 480, and 360', () => {
			value = new ValueObjects.RenditionHeights([1080, 720, 480, 360]).valueOf();
		});
		Then('the value should be the heights in the same order', () => {
			expect(value).toEqual([1080, 720, 480, 360]);
		});
	});

	Scenario('Rejecting an empty rendition list', ({ When, Then }) => {
		let action: () => unknown;
		When('I try to create rendition heights with an empty list', () => {
			action = () => new ValueObjects.RenditionHeights([]);
		});
		Then('an error should be thrown', () => {
			expect(action).toThrow();
		});
	});

	Scenario('Allowing no failure code', ({ When, Then }) => {
		let value: string | null;
		When('I create a failure code with null', () => {
			value = new ValueObjects.FailureCode(null).valueOf();
		});
		Then('the value should be null', () => {
			expect(value).toBeNull();
		});
	});
});
