import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';
import * as ValueObjects from './service-ticket-v1.value-objects.ts';

const test = { for: describeFeature };
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feature = await loadFeature(
	path.resolve(__dirname, 'features/service-ticket-v1.value-objects.feature'),
);

test.for(feature, ({ Scenario }) => {
	// Title
	Scenario('Creating a title with valid value', ({ When, Then }) => {
		let value: string;
		When('I create a title with "Valid Title"', () => {
			value = new ValueObjects.Title('Valid Title').valueOf();
		});
		Then('the value should be "Valid Title"', () => {
			expect(value).toBe('Valid Title');
		});
	});

	Scenario(
		'Creating a title with leading and trailing whitespace',
		({ When, Then }) => {
			let value: string;
			When('I create a title with "  Valid Title  "', () => {
				value = new ValueObjects.Title('  Valid Title  ').valueOf();
			});
			Then('the value should be "Valid Title"', () => {
				expect(value).toBe('Valid Title');
			});
		},
	);

	Scenario('Creating a title with maximum allowed length', ({ When, Then }) => {
		let value: string;
		When('I create a title with a string of 200 characters', () => {
			const longTitle = 'a'.repeat(200);
			value = new ValueObjects.Title(longTitle).valueOf();
		});
		Then('the value should be the 200 character string', () => {
			expect(value).toBe('a'.repeat(200));
		});
	});

	Scenario(
		'Creating a title with more than maximum allowed length',
		({ When, Then }) => {
			let createTitleAboveMaxLength: () => void;
			When('I try to create a title with a string of 201 characters', () => {
				createTitleAboveMaxLength = () => {
					new ValueObjects.Title('a'.repeat(201));
				};
			});
			Then('an error should be thrown indicating the title is too long', () => {
				expect(createTitleAboveMaxLength).toThrow('Too long');
			});
		},
	);

	Scenario('Creating a title with minimum allowed length', ({ When, Then }) => {
		let value: string;
		When('I create a title with a string of 5 characters', () => {
			value = new ValueObjects.Title('abcde').valueOf();
		});
		Then('the value should be the 5 character string', () => {
			expect(value).toBe('abcde');
		});
	});

	Scenario(
		'Creating a title with less than minimum allowed length',
		({ When, Then }) => {
			let createTitleBelowMinLength: () => void;
			When('I try to create a title with a string of 4 characters', () => {
				createTitleBelowMinLength = () => {
					new ValueObjects.Title('abcd');
				};
			});
			Then(
				'an error should be thrown indicating the title is too short',
				() => {
					expect(createTitleBelowMinLength).toThrow('Too short');
				},
			);
		},
	);

	Scenario('Creating a title with null', ({ When, Then }) => {
		let createTitleWithNull: () => void;
		When('I try to create a title with null', () => {
			createTitleWithNull = () => {
				// @ts-expect-error Testing invalid input
				new ValueObjects.Title(null);
			};
		});
		Then('an error should be thrown indicating the title is invalid', () => {
			expect(createTitleWithNull).toThrow('Wrong raw value type');
		});
	});

	Scenario('Creating a title with undefined', ({ When, Then }) => {
		let createTitleWithUndefined: () => void;
		When('I try to create a title with undefined', () => {
			createTitleWithUndefined = () => {
				// @ts-expect-error Testing invalid input
				new ValueObjects.Title(undefined);
			};
		});
		Then('an error should be thrown indicating the title is invalid', () => {
			expect(createTitleWithUndefined).toThrow('Wrong raw value type');
		});
	});

	// Description
	Scenario('Creating a description with valid value', ({ When, Then }) => {
		let value: string;
		When('I create a description with "Valid description"', () => {
			value = new ValueObjects.Description('Valid description').valueOf();
		});
		Then('the value should be "Valid description"', () => {
			expect(value).toBe('Valid description');
		});
	});

	Scenario(
		'Creating a description with leading and trailing whitespace',
		({ When, Then }) => {
			let value: string;
			When('I create a description with "  Valid description  "', () => {
				value = new ValueObjects.Description('  Valid description  ').valueOf();
			});
			Then('the value should be "Valid description"', () => {
				expect(value).toBe('Valid description');
			});
		},
	);

	Scenario(
		'Creating a description with maximum allowed length',
		({ When, Then }) => {
			let value: string;
			When('I create a description with a string of 2000 characters', () => {
				const longDescription = 'a'.repeat(2000);
				value = new ValueObjects.Description(longDescription).valueOf();
			});
			Then('the value should be the 2000 character string', () => {
				expect(value).toBe('a'.repeat(2000));
			});
		},
	);

	Scenario(
		'Creating a description with more than maximum allowed length',
		({ When, Then }) => {
			let createDescriptionAboveMaxLength: () => void;
			When(
				'I try to create a description with a string of 2001 characters',
				() => {
					createDescriptionAboveMaxLength = () => {
						new ValueObjects.Description('a'.repeat(2001));
					};
				},
			);
			Then(
				'an error should be thrown indicating the description is too long',
				() => {
					expect(createDescriptionAboveMaxLength).toThrow('Too long');
				},
			);
		},
	);

	Scenario('Creating a description with null', ({ When, Then }) => {
		let createDescriptionWithNull: () => void;
		When('I try to create a description with null', () => {
			createDescriptionWithNull = () => {
				// @ts-expect-error Testing invalid input
				new ValueObjects.Description(null);
			};
		});
		Then(
			'an error should be thrown indicating the description is invalid',
			() => {
				expect(createDescriptionWithNull).toThrow('Wrong raw value type');
			},
		);
	});

	Scenario('Creating a description with undefined', ({ When, Then }) => {
		let createDescriptionWithUndefined: () => void;
		When('I try to create a description with undefined', () => {
			createDescriptionWithUndefined = () => {
				// @ts-expect-error Testing invalid input
				new ValueObjects.Description(undefined);
			};
		});
		Then(
			'an error should be thrown indicating the description is invalid',
			() => {
				expect(createDescriptionWithUndefined).toThrow('Wrong raw value type');
			},
		);
	});

	// StatusCode
	Scenario(
		'Creating a status code with valid value "DRAFT"',
		({ When, Then }) => {
			let value: string;
			When('I create a status code with "DRAFT"', () => {
				value = new ValueObjects.StatusCode('DRAFT').valueOf();
			});
			Then('the value should be "DRAFT"', () => {
				expect(value).toBe('DRAFT');
			});
		},
	);

	Scenario(
		'Creating a status code with valid value "SUBMITTED"',
		({ When, Then }) => {
			let value: string;
			When('I create a status code with "SUBMITTED"', () => {
				value = new ValueObjects.StatusCode('SUBMITTED').valueOf();
			});
			Then('the value should be "SUBMITTED"', () => {
				expect(value).toBe('SUBMITTED');
			});
		},
	);

	Scenario(
		'Creating a status code with valid value "ASSIGNED"',
		({ When, Then }) => {
			let value: string;
			When('I create a status code with "ASSIGNED"', () => {
				value = new ValueObjects.StatusCode('ASSIGNED').valueOf();
			});
			Then('the value should be "ASSIGNED"', () => {
				expect(value).toBe('ASSIGNED');
			});
		},
	);

	Scenario(
		'Creating a status code with valid value "INPROGRESS"',
		({ When, Then }) => {
			let value: string;
			When('I create a status code with "INPROGRESS"', () => {
				value = new ValueObjects.StatusCode('INPROGRESS').valueOf();
			});
			Then('the value should be "INPROGRESS"', () => {
				expect(value).toBe('INPROGRESS');
			});
		},
	);

	Scenario(
		'Creating a status code with valid value "COMPLETED"',
		({ When, Then }) => {
			let value: string;
			When('I create a status code with "COMPLETED"', () => {
				value = new ValueObjects.StatusCode('COMPLETED').valueOf();
			});
			Then('the value should be "COMPLETED"', () => {
				expect(value).toBe('COMPLETED');
			});
		},
	);

	Scenario(
		'Creating a status code with valid value "CLOSED"',
		({ When, Then }) => {
			let value: string;
			When('I create a status code with "CLOSED"', () => {
				value = new ValueObjects.StatusCode('CLOSED').valueOf();
			});
			Then('the value should be "CLOSED"', () => {
				expect(value).toBe('CLOSED');
			});
		},
	);

	Scenario('Creating a status code with invalid value', ({ When, Then }) => {
		let createStatusCodeWithInvalidValue: () => void;
		When('I try to create a status code with "INVALID"', () => {
			createStatusCodeWithInvalidValue = () => {
				new ValueObjects.StatusCode('INVALID');
			};
		});
		Then(
			'an error should be thrown indicating the status code is invalid',
			() => {
				expect(createStatusCodeWithInvalidValue).toThrow(
					'Value not found in set',
				);
			},
		);
	});

	Scenario('Creating a status code with null', ({ When, Then }) => {
		let createStatusCodeWithNull: () => void;
		When('I try to create a status code with null', () => {
			createStatusCodeWithNull = () => {
				// @ts-expect-error Testing invalid input
				new ValueObjects.StatusCode(null);
			};
		});
		Then(
			'an error should be thrown indicating the status code is invalid',
			() => {
				expect(createStatusCodeWithNull).toThrow('Wrong raw value type');
			},
		);
	});

	Scenario('Creating a status code with undefined', ({ When, Then }) => {
		let createStatusCodeWithUndefined: () => void;
		When('I try to create a status code with undefined', () => {
			createStatusCodeWithUndefined = () => {
				// @ts-expect-error Testing invalid input
				new ValueObjects.StatusCode(undefined);
			};
		});
		Then(
			'an error should be thrown indicating the status code is invalid',
			() => {
				expect(createStatusCodeWithUndefined).toThrow('Wrong raw value type');
			},
		);
	});

	// Priority
	Scenario('Creating a priority with valid value', ({ When, Then }) => {
		let value: number;
		When('I create a priority with 3', () => {
			value = new ValueObjects.Priority(3).valueOf();
		});
		Then('the value should be 3', () => {
			expect(value).toBe(3);
		});
	});

	Scenario(
		'Creating a priority with minimum allowed value',
		({ When, Then }) => {
			let value: number;
			When('I create a priority with 1', () => {
				value = new ValueObjects.Priority(1).valueOf();
			});
			Then('the value should be 1', () => {
				expect(value).toBe(1);
			});
		},
	);

	Scenario(
		'Creating a priority with maximum allowed value',
		({ When, Then }) => {
			let value: number;
			When('I create a priority with 5', () => {
				value = new ValueObjects.Priority(5).valueOf();
			});
			Then('the value should be 5', () => {
				expect(value).toBe(5);
			});
		},
	);

	Scenario(
		'Creating a priority with less than minimum allowed value',
		({ When, Then }) => {
			let createPriorityBelowMin: () => void;
			When('I try to create a priority with 0', () => {
				createPriorityBelowMin = () => {
					new ValueObjects.Priority(0);
				};
			});
			Then(
				'an error should be thrown indicating the priority is too low',
				() => {
					expect(createPriorityBelowMin).toThrow('Too small');
				},
			);
		},
	);

	Scenario(
		'Creating a priority with more than maximum allowed value',
		({ When, Then }) => {
			let createPriorityAboveMax: () => void;
			When('I try to create a priority with 6', () => {
				createPriorityAboveMax = () => {
					new ValueObjects.Priority(6);
				};
			});
			Then(
				'an error should be thrown indicating the priority is too high',
				() => {
					expect(createPriorityAboveMax).toThrow('Too big');
				},
			);
		},
	);

	Scenario('Creating a priority with null', ({ When, Then }) => {
		let createPriorityWithNull: () => void;
		When('I try to create a priority with null', () => {
			createPriorityWithNull = () => {
				// @ts-expect-error Testing invalid input
				new ValueObjects.Priority(null);
			};
		});
		Then('an error should be thrown indicating the priority is invalid', () => {
			expect(createPriorityWithNull).toThrow('Wrong raw value type');
		});
	});

	Scenario('Creating a priority with undefined', ({ When, Then }) => {
		let createPriorityWithUndefined: () => void;
		When('I try to create a priority with undefined', () => {
			createPriorityWithUndefined = () => {
				// @ts-expect-error Testing invalid input
				new ValueObjects.Priority(undefined);
			};
		});
		Then('an error should be thrown indicating the priority is invalid', () => {
			expect(createPriorityWithUndefined).toThrow('Wrong raw value type');
		});
	});
});
