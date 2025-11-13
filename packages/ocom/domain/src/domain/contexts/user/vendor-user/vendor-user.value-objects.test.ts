import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';

import * as ValueObjects from './vendor-user.value-objects.ts';

const test = { for: describeFeature };
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feature = await loadFeature(
	path.resolve(__dirname, 'features/vendor-user.value-objects.feature'),
);

test.for(feature, ({ Scenario }) => {
	// RestOfName
	Scenario('Creating a rest of name with valid value', ({ When, Then }) => {
		let value: string;
		When('I create a rest of name with "Alice"', () => {
			value = new ValueObjects.RestOfName('Alice').valueOf() as string;
		});
		Then('the value should be "Alice"', () => {
			expect(value).toBe('Alice');
		});
	});

	Scenario(
		'Creating a rest of name with leading and trailing whitespace',
		({ When, Then }) => {
			let value: string;
			When('I create a rest of name with "  Alice  "', () => {
				value = new ValueObjects.RestOfName('  Alice  ').valueOf() as string;
			});
			Then('the value should be "Alice"', () => {
				expect(value).toBe('Alice');
			});
		},
	);

	Scenario(
		'Creating a rest of name with maximum allowed length',
		({ When, Then }) => {
			let value: string;
			When('I create a rest of name with a string of 50 characters', () => {
				value = new ValueObjects.RestOfName('a'.repeat(50)).valueOf() as string;
			});
			Then('the value should be the 50 character string', () => {
				expect(value).toBe('a'.repeat(50));
			});
		},
	);

	Scenario(
		'Creating a rest of name with more than maximum allowed length',
		({ When, Then }) => {
			let createRestOfName: () => void;
			When(
				'I try to create a rest of name with a string of 51 characters',
				() => {
					createRestOfName = () => {
						new ValueObjects.RestOfName('a'.repeat(51)).valueOf();
					};
				},
			);
			Then(
				'an error should be thrown indicating the rest of name is too long',
				() => {
					expect(createRestOfName).throws('Too long');
				},
			);
		},
	);

	Scenario(
		'Creating a rest of name with minimum allowed length',
		({ When, Then }) => {
			let value: string;
			When('I create a rest of name with a string of 1 character', () => {
				value = new ValueObjects.RestOfName('b').valueOf() as string;
			});
			Then('the value should be the 1 character string', () => {
				expect(value).toBe('b');
			});
		},
	);

	Scenario(
		'Creating a rest of name with less than minimum allowed length',
		({ When, Then }) => {
			let createRestOfName: () => void;
			When('I try to create a rest of name with an empty string', () => {
				createRestOfName = () => {
					new ValueObjects.RestOfName('').valueOf();
				};
			});
			Then(
				'an error should be thrown indicating the rest of name is too short',
				() => {
					expect(createRestOfName).throws('Too short');
				},
			);
		},
	);

	Scenario('Creating a rest of name with undefined', ({ When, Then }) => {
		let createRestOfName: () => void;
		When('I try to create a rest of name with undefined', () => {
			createRestOfName = () => {
				new ValueObjects.RestOfName(undefined).valueOf();
			};
		});
		Then('the value should be undefined', () => {
			expect(createRestOfName).not.toThrow();
			expect(createRestOfName()).toBeUndefined();
		});
	});

	// LastName
	Scenario('Creating a last name with valid value', ({ When, Then }) => {
		let value: string;
		When('I create a last name with "Smith"', () => {
			value = new ValueObjects.LastName('Smith').valueOf();
		});
		Then('the value should be "Smith"', () => {
			expect(value).toBe('Smith');
		});
	});

	Scenario(
		'Creating a last name with leading and trailing whitespace',
		({ When, Then }) => {
			let value: string;
			When('I create a last name with "  Smith  "', () => {
				value = new ValueObjects.LastName('  Smith  ').valueOf();
			});
			Then('the value should be "Smith"', () => {
				expect(value).toBe('Smith');
			});
		},
	);

	Scenario(
		'Creating a last name with maximum allowed length',
		({ When, Then }) => {
			let value: string;
			When('I create a last name with a string of 50 characters', () => {
				value = new ValueObjects.LastName('b'.repeat(50)).valueOf();
			});
			Then('the value should be the 50 character string', () => {
				expect(value).toBe('b'.repeat(50));
			});
		},
	);

	Scenario(
		'Creating a last name with more than maximum allowed length',
		({ When, Then }) => {
			let createLastName: () => void;
			When('I try to create a last name with a string of 51 characters', () => {
				createLastName = () => {
					new ValueObjects.LastName('b'.repeat(51)).valueOf();
				};
			});
			Then(
				'an error should be thrown indicating the last name is too long',
				() => {
					expect(createLastName).throws('Too long');
				},
			);
		},
	);

	Scenario(
		'Creating a last name with minimum allowed length',
		({ When, Then }) => {
			let value: string;
			When('I create a last name with a string of 1 character', () => {
				value = new ValueObjects.LastName('c').valueOf();
			});
			Then('the value should be the 1 character string', () => {
				expect(value).toBe('c');
			});
		},
	);

	Scenario(
		'Creating a last name with less than minimum allowed length',
		({ When, Then }) => {
			let createLastName: () => void;
			When('I try to create a last name with an empty string', () => {
				createLastName = () => {
					new ValueObjects.LastName('').valueOf();
				};
			});
			Then(
				'an error should be thrown indicating the last name is too short',
				() => {
					expect(createLastName).throws('Too short');
				},
			);
		},
	);

	// DisplayName
	Scenario('Creating a display name with valid value', ({ When, Then }) => {
		let value: string;
		When('I create a display name with "Alice Smith"', () => {
			value = new ValueObjects.DisplayName('Alice Smith').valueOf();
		});
		Then('the value should be "Alice Smith"', () => {
			expect(value).toBe('Alice Smith');
		});
	});

	Scenario(
		'Creating a display name with leading and trailing whitespace',
		({ When, Then }) => {
			let value: string;
			When('I create a display name with "  Alice Smith  "', () => {
				value = new ValueObjects.DisplayName('  Alice Smith  ').valueOf();
			});
			Then('the value should be "Alice Smith"', () => {
				expect(value).toBe('Alice Smith');
			});
		},
	);

	Scenario(
		'Creating a display name with maximum allowed length',
		({ When, Then }) => {
			let value: string;
			When('I create a display name with a string of 100 characters', () => {
				value = new ValueObjects.DisplayName('c'.repeat(100)).valueOf();
			});
			Then('the value should be the 100 character string', () => {
				expect(value).toBe('c'.repeat(100));
			});
		},
	);

	Scenario(
		'Creating a display name with more than maximum allowed length',
		({ When, Then }) => {
			let createDisplayName: () => void;
			When(
				'I try to create a display name with a string of 101 characters',
				() => {
					createDisplayName = () => {
						new ValueObjects.DisplayName('c'.repeat(101)).valueOf();
					};
				},
			);
			Then(
				'an error should be thrown indicating the display name is too long',
				() => {
					expect(createDisplayName).throws('Too long');
				},
			);
		},
	);

	Scenario(
		'Creating a display name with minimum allowed length',
		({ When, Then }) => {
			let value: string;
			When('I create a display name with a string of 1 character', () => {
				value = new ValueObjects.DisplayName('d').valueOf();
			});
			Then('the value should be the 1 character string', () => {
				expect(value).toBe('d');
			});
		},
	);

	Scenario(
		'Creating a display name with less than minimum allowed length',
		({ When, Then }) => {
			let createDisplayName: () => void;
			When('I try to create a display name with an empty string', () => {
				createDisplayName = () => {
					new ValueObjects.DisplayName('').valueOf();
				};
			});
			Then(
				'an error should be thrown indicating the display name is too short',
				() => {
					expect(createDisplayName).throws('Too short');
				},
			);
		},
	);
});
