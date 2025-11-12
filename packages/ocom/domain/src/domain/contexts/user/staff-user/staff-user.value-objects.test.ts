import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';
import * as ValueObjects from './staff-user.value-objects.ts';

const test = { for: describeFeature };
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feature = await loadFeature(
	path.resolve(__dirname, 'features/staff-user.value-objects.feature'),
);

test.for(feature, ({ Scenario }) => {
	// RestOfName
	Scenario('Creating a first name with valid value', ({ When, Then }) => {
		let value: string;
		When('I create a first name with "Alice"', () => {
			value = new ValueObjects.FirstName('Alice').valueOf();
		});
		Then('the value should be "Alice"', () => {
			expect(value).toBe('Alice');
		});
	});

	Scenario(
		'Creating a first name with leading and trailing whitespace',
		({ When, Then }) => {
			let value: string;
			When('I create a first name with "  Alice  "', () => {
				value = new ValueObjects.FirstName('  Alice  ').valueOf();
			});
			Then('the value should be "Alice"', () => {
				expect(value).toBe('Alice');
			});
		},
	);

	Scenario(
		'Creating a first name with maximum allowed length',
		({ When, Then }) => {
			let value: string;
			When('I create a first name with a string of 50 characters', () => {
				value = new ValueObjects.FirstName('a'.repeat(50)).valueOf();
			});
			Then('the value should be the 50 character string', () => {
				expect(value).toBe('a'.repeat(50));
			});
		},
	);

	Scenario(
		'Creating a first name with more than maximum allowed length',
		({ When, Then }) => {
			let createRestOfName: () => void;
			When(
				'I try to create a first name with a string of 51 characters',
				() => {
					createRestOfName = () => {
						new ValueObjects.FirstName('a'.repeat(51)).valueOf();
					};
				},
			);
			Then(
				'an error should be thrown indicating the first name is too long',
				() => {
					expect(createRestOfName).throws('Too long');
				},
			);
		},
	);

	Scenario('Creating a first name with an empty string', ({ When, Then }) => {
		let createRestOfName: () => void;
		When('I try to create a first name with an empty string', () => {
			createRestOfName = () => {
				new ValueObjects.FirstName('').valueOf();
			};
		});
		Then(
			'an error should be thrown indicating the first name is too short',
			() => {
				expect(createRestOfName).throws('Too short');
			},
		);
	});

	Scenario('Creating a first name with null', ({ When, Then }) => {
		let createRestOfNameNull: () => void;
		When('I try to create a first name with null', () => {
			createRestOfNameNull = () => {
				// @ts-expect-error
				new ValueObjects.FirstName(null).valueOf();
			};
		});
		Then('an error should be thrown indicating the wrong type was used', () => {
			expect(createRestOfNameNull).throws('Wrong raw value type');
		});
	});

	Scenario('Creating a first name with undefined', ({ When, Then }) => {
		let createRestOfNameUndefined: () => void;
		When('I try to create a first name with undefined', () => {
			createRestOfNameUndefined = () => {
				// @ts-expect-error
				new ValueObjects.FirstName(undefined).valueOf();
			};
		});
		Then('an error should be thrown indicating the wrong type was used', () => {
			expect(createRestOfNameUndefined).throws('Wrong raw value type');
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

	Scenario('Creating a last name with an empty string', ({ When, Then }) => {
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
	});

	Scenario('Creating a last name with null', ({ When, Then }) => {
		let createLastNameNull: () => void;
		When('I try to create a last name with null', () => {
			createLastNameNull = () => {
				// @ts-expect-error
				new ValueObjects.LastName(null).valueOf();
			};
		});
		Then('an error should be thrown indicating the wrong type was used', () => {
			expect(createLastNameNull).throws('Wrong raw value type');
		});
	});

	Scenario('Creating a last name with undefined', ({ When, Then }) => {
		let createLastNameUndefined: () => void;
		When('I try to create a last name with undefined', () => {
			createLastNameUndefined = () => {
				// @ts-expect-error
				new ValueObjects.LastName(undefined).valueOf();
			};
		});
		Then('an error should be thrown indicating the wrong type was used', () => {
			expect(createLastNameUndefined).throws('Wrong raw value type');
		});
	});

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

	Scenario('Creating a display name with null', ({ When, Then }) => {
		let createDisplayNameNull: () => void;
		When('I try to create a display name with null', () => {
			createDisplayNameNull = () => {
				// @ts-expect-error
				new ValueObjects.DisplayName(null).valueOf();
			};
		});
		Then('an error should be thrown indicating the wrong type was used', () => {
			expect(createDisplayNameNull).throws('Wrong raw value type');
		});
	});

	Scenario('Creating a display name with undefined', ({ When, Then }) => {
		let createDisplayNameUndefined: () => void;
		When('I try to create a display name with undefined', () => {
			createDisplayNameUndefined = () => {
				// @ts-expect-error
				new ValueObjects.DisplayName(undefined).valueOf();
			};
		});
		Then('an error should be thrown indicating the wrong type was used', () => {
			expect(createDisplayNameUndefined).throws('Wrong raw value type');
		});
	});
});
