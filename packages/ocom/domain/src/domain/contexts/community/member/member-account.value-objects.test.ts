import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';
import * as ValueObjects from './member-account.value-objects.ts';

const test = { for: describeFeature };
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feature = await loadFeature(
	path.resolve(__dirname, 'features/member-account.value-objects.feature'),
);

test.for(feature, ({ Scenario, ScenarioOutline }) => {
	// FirstName
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
			When('I create a first name with a string of 500 characters', () => {
				value = new ValueObjects.FirstName('a'.repeat(500)).valueOf();
			});
			Then('the value should be the 500 character string', () => {
				expect(value).toBe('a'.repeat(500));
			});
		},
	);

	Scenario(
		'Creating a first name with more than maximum allowed length',
		({ When, Then }) => {
			let createFirstNameAboveMax: () => void;
			When(
				'I try to create a first name with a string of 501 characters',
				() => {
					createFirstNameAboveMax = () => {
						new ValueObjects.FirstName('a'.repeat(501)).valueOf();
					};
				},
			);
			Then(
				'an error should be thrown indicating the first name is too long',
				() => {
					expect(createFirstNameAboveMax).toThrow('Too long');
				},
			);
		},
	);

	Scenario(
		'Creating a first name with less than minimum allowed length',
		({ When, Then }) => {
			let createFirstNameBelowMin: () => void;
			When('I try to create a first name with an empty string', () => {
				createFirstNameBelowMin = () => {
					new ValueObjects.FirstName('').valueOf();
				};
			});
			Then(
				'an error should be thrown indicating the first name is too short',
				() => {
					expect(createFirstNameBelowMin).toThrow('Too short');
				},
			);
		},
	);

	Scenario('Creating a first name with null', ({ When, Then }) => {
		let createFirstNameNull: () => void;
		When('I try to create a first name with null', () => {
			createFirstNameNull = () => {
				// @ts-expect-error
				new ValueObjects.FirstName(null).valueOf();
			};
		});
		Then(
			'an error should be thrown indicating the first name is invalid',
			() => {
				expect(createFirstNameNull).toThrow(/Wrong raw value type/i);
			},
		);
	});

	Scenario('Creating a first name with undefined', ({ When, Then }) => {
		let createFirstNameUndefined: () => void;
		When('I try to create a first name with undefined', () => {
			createFirstNameUndefined = () => {
				// @ts-expect-error
				new ValueObjects.FirstName(undefined).valueOf();
			};
		});
		Then(
			'an error should be thrown indicating the first name is invalid',
			() => {
				expect(createFirstNameUndefined).toThrow(/Wrong raw value type/i);
			},
		);
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
			When('I create a last name with a string of 500 characters', () => {
				value = new ValueObjects.LastName('a'.repeat(500)).valueOf();
			});
			Then('the value should be the 500 character string', () => {
				expect(value).toBe('a'.repeat(500));
			});
		},
	);

	Scenario(
		'Creating a last name with more than maximum allowed length',
		({ When, Then }) => {
			let createLastNameAboveMax: () => void;
			When(
				'I try to create a last name with a string of 501 characters',
				() => {
					createLastNameAboveMax = () => {
						new ValueObjects.LastName('a'.repeat(501)).valueOf();
					};
				},
			);
			Then(
				'an error should be thrown indicating the last name is too long',
				() => {
					expect(createLastNameAboveMax).toThrow('Too long');
				},
			);
		},
	);

	Scenario(
		'Creating a last name with less than minimum allowed length',
		({ When, Then }) => {
			let createLastNameBelowMin: () => void;
			When('I try to create a last name with an empty string', () => {
				createLastNameBelowMin = () => {
					new ValueObjects.LastName('').valueOf();
				};
			});
			Then(
				'an error should be thrown indicating the last name is too short',
				() => {
					expect(createLastNameBelowMin).toThrow('Too short');
				},
			);
		},
	);

	Scenario('Creating a last name with null', ({ When, Then }) => {
		let createLastNameNull: () => void;
		When('I try to create a last name with null', () => {
			createLastNameNull = () => {
				// @ts-expect-error
				new ValueObjects.LastName(null).valueOf();
			};
		});
		Then(
			'an error should be thrown indicating the last name is invalid',
			() => {
				expect(createLastNameNull).toThrow(/Wrong raw value type/i);
			},
		);
	});

	Scenario('Creating a last name with undefined', ({ When, Then }) => {
		let createLastNameUndefined: () => void;
		When('I try to create a last name with undefined', () => {
			createLastNameUndefined = () => {
				// @ts-expect-error
				new ValueObjects.LastName(undefined).valueOf();
			};
		});
		Then(
			'an error should be thrown indicating the last name is invalid',
			() => {
				expect(createLastNameUndefined).toThrow(/Wrong raw value type/i);
			},
		);
	});

	// AccountStatusCode
	ScenarioOutline(
		'Creating an account status code with valid value',
		({ When, Then }, variables) => {
			let value: string;
			When('I create an account status code with "<statusCode>"', () => {
				value = new ValueObjects.AccountStatusCode(
				// biome-ignore lint/complexity/useLiteralKeys: Variable comes from Cucumber test table
				// @ts-expect-error - Cucumber test table variables use index signature
					variables.statusCode,
				).valueOf();
			});
			Then('the value should be "<statusCode>"', () => {
				// biome-ignore lint:useLiteralKeys
				expect(value).toBe(variables['statusCode']);
			});
		},
	);

	Scenario(
		'Creating an account status code with an invalid value',
		({ When, Then }) => {
			let createStatusCodeInvalid: () => void;
			When('I try to create an account status code with "INVALID"', () => {
				createStatusCodeInvalid = () => {
					new ValueObjects.AccountStatusCode('INVALID').valueOf();
				};
			});
			Then(
				'an error should be thrown indicating the account status code is invalid',
				() => {
					expect(createStatusCodeInvalid).toThrow();
				},
			);
		},
	);

	Scenario('Creating an account status code with null', ({ When, Then }) => {
		let createStatusCodeNull: () => void;
		When('I try to create an account status code with null', () => {
			createStatusCodeNull = () => {
				// @ts-expect-error
				new ValueObjects.AccountStatusCode(null).valueOf();
			};
		});
		Then(
			'an error should be thrown indicating the account status code is invalid',
			() => {
				expect(createStatusCodeNull).toThrow(/Wrong raw value type/i);
			},
		);
	});

	Scenario(
		'Creating an account status code with undefined',
		({ When, Then }) => {
			let createStatusCodeUndefined: () => void;
			When('I try to create an account status code with undefined', () => {
				createStatusCodeUndefined = () => {
					// @ts-expect-error
					new ValueObjects.AccountStatusCode(undefined).valueOf();
				};
			});
			Then(
				'an error should be thrown indicating the account status code is invalid',
				() => {
					expect(createStatusCodeUndefined).toThrow(/Wrong raw value type/i);
				},
			);
		},
	);
});
