import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import type { VOError } from '@lucaspaganini/value-objects';
import { expect } from 'vitest';
import * as ValueObjects from './member-custom-view.value-objects.ts';

const test = { for: describeFeature };
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feature = await loadFeature(
	path.resolve(__dirname, 'features/member-custom-view.value-objects.feature'),
);

test.for(feature, ({ Scenario, ScenarioOutline }) => {
	// CustomViewName
	Scenario('Creating a custom view name with valid value', ({ When, Then }) => {
		let value: string;
		When('I create a custom view name with "My View"', () => {
			value = new ValueObjects.CustomViewName('My View').valueOf();
		});
		Then('the value should be "My View"', () => {
			expect(value).toBe('My View');
		});
	});

	Scenario(
		'Creating a custom view name with leading and trailing whitespace',
		({ When, Then }) => {
			let value: string;
			When('I create a custom view name with "  My View  "', () => {
				value = new ValueObjects.CustomViewName('  My View  ').valueOf();
			});
			Then('the value should be "My View"', () => {
				expect(value).toBe('My View');
			});
		},
	);

	Scenario(
		'Creating a custom view name with maximum allowed length',
		({ When, Then }) => {
			let value: string;
			When(
				'I create a custom view name with a string of 500 characters',
				() => {
					value = new ValueObjects.CustomViewName('a'.repeat(500)).valueOf();
				},
			);
			Then('the value should be the 500 character string', () => {
				expect(value).toBe('a'.repeat(500));
			});
		},
	);

	Scenario(
		'Creating a custom view name with more than maximum allowed length',
		({ When, Then }) => {
			let createName: () => void;
			When(
				'I try to create a custom view name with a string of 501 characters',
				() => {
					createName = () => {
						new ValueObjects.CustomViewName('a'.repeat(501)).valueOf();
					};
				},
			);
			Then(
				'an error should be thrown indicating the custom view name is too long',
				() => {
					expect(createName).toThrow('Too long');
				},
			);
		},
	);

	Scenario(
		'Creating a custom view name with less than minimum allowed length',
		({ When, Then }) => {
			let value: string;
			When('I try to create a custom view name with an empty string', () => {
				value = new ValueObjects.CustomViewName('').valueOf();
			});
			Then('the value should be ""', () => {
				expect(value).toBe('');
			});
		},
	);

	Scenario('Creating a custom view name with null', ({ When, Then }) => {
		let createName: () => void;
		When('I try to create a custom view name with null', () => {
			createName = () => {
				// @ts-expect-error
				new ValueObjects.CustomViewName(null).valueOf();
			};
		});
		Then(
			'an error should be thrown indicating the custom view name is invalid',
			() => {
				expect(createName).toThrow(/Wrong raw value type/i);
			},
		);
	});

	Scenario('Creating a custom view name with undefined', ({ When, Then }) => {
		let createName: () => void;
		When('I try to create a custom view name with undefined', () => {
			createName = () => {
				// @ts-expect-error
				new ValueObjects.CustomViewName(undefined).valueOf();
			};
		});
		Then(
			'an error should be thrown indicating the custom view name is invalid',
			() => {
				expect(createName).toThrow(/Wrong raw value type/i);
			},
		);
	});

	// CustomViewType
	ScenarioOutline(
		'Creating a custom view type with valid value',
		({ When, Then }, variables) => {
			let value: string;
			When('I create a custom view type with "<type>"', () => {
				// biome-ignore lint:useLiteralKeys
				value = new ValueObjects.CustomViewType(variables['type']).valueOf();
			});
			Then('the value should be "<type>"', () => {
				// biome-ignore lint:useLiteralKeys
				expect(value).toBe(variables['type']);
			});
		},
	);

	Scenario(
		'Creating a custom view type with invalid value',
		({ When, Then }) => {
			let createType: () => void;
			When('I try to create a custom view type with "INVALID"', () => {
				createType = () => {
					new ValueObjects.CustomViewType('INVALID').valueOf();
				};
			});
			Then(
				'an error should be thrown indicating the custom view type is invalid',
				() => {
					expect(createType).toThrow(/Invalid custom view type/i);
				},
			);
		},
	);

	Scenario('Creating a custom view type with null', ({ When, Then }) => {
		let createType: () => void;
		When('I try to create a custom view type with null', () => {
			createType = () => {
				// @ts-expect-error
				new ValueObjects.CustomViewType(null).valueOf();
			};
		});
		Then(
			'an error should be thrown indicating the custom view type is invalid',
			() => {
				expect(createType).toThrow(/Wrong raw value type/i);
			},
		);
	});

	Scenario('Creating a custom view type with undefined', ({ When, Then }) => {
		let createType: () => void;
		When('I try to create a custom view type with undefined', () => {
			createType = () => {
				// @ts-expect-error
				new ValueObjects.CustomViewType(undefined).valueOf();
			};
		});
		Then(
			'an error should be thrown indicating the custom view type is invalid',
			() => {
				expect(createType).toThrow(/Wrong raw value type/i);
			},
		);
	});

	// CustomViewSortOrder
	Scenario(
		'Creating a custom view sort order with valid value',
		({ When, Then }) => {
			let value: string;
			When('I create a custom view sort order with "asc"', () => {
				value = new ValueObjects.CustomViewSortOrder('asc').valueOf();
			});
			Then('the value should be "asc"', () => {
				expect(value).toBe('asc');
			});
		},
	);

	Scenario(
		'Creating a custom view sort order with leading and trailing whitespace',
		({ When, Then }) => {
			let value: string;
			When('I create a custom view sort order with "  asc  "', () => {
				value = new ValueObjects.CustomViewSortOrder('  asc  ').valueOf();
			});
			Then('the value should be "asc"', () => {
				expect(value).toBe('asc');
			});
		},
	);

	Scenario(
		'Creating a custom view sort order with maximum allowed length',
		({ When, Then }) => {
			let value: string;
			When(
				'I create a custom view sort order with a string of 500 characters',
				() => {
					value = new ValueObjects.CustomViewSortOrder(
						'a'.repeat(500),
					).valueOf();
				},
			);
			Then('the value should be the 500 character string', () => {
				expect(value).toBe('a'.repeat(500));
			});
		},
	);

	Scenario(
		'Creating a custom view sort order with more than maximum allowed length',
		({ When, Then }) => {
			let createSortOrder: () => void;
			When(
				'I try to create a custom view sort order with a string of 501 characters',
				() => {
					createSortOrder = () => {
						new ValueObjects.CustomViewSortOrder('a'.repeat(501)).valueOf();
					};
				},
			);
			Then(
				'an error should be thrown indicating the custom view sort order is too long',
				() => {
					expect(createSortOrder).toThrow('Too long');
				},
			);
		},
	);

	Scenario('Creating a custom view sort order with null', ({ When, Then }) => {
		let createSortOrder: () => void;
		When('I try to create a custom view sort order with null', () => {
			createSortOrder = () => {
				// @ts-expect-error
				new ValueObjects.CustomViewSortOrder(null).valueOf();
			};
		});
		Then(
			'an error should be thrown indicating the custom view sort order is invalid',
			() => {
				expect(createSortOrder).toThrow(/Wrong raw value type/i);
			},
		);
	});

	Scenario(
		'Creating a custom view sort order with undefined',
		({ When, Then }) => {
			let createSortOrder: () => void;
			When('I try to create a custom view sort order with undefined', () => {
				createSortOrder = () => {
					// @ts-expect-error
					new ValueObjects.CustomViewSortOrder(undefined).valueOf();
				};
			});
			Then(
				'an error should be thrown indicating the custom view sort order is invalid',
				() => {
					expect(createSortOrder).toThrow(/Wrong raw value type/i);
				},
			);
		},
	);

	// CustomViewFilters
	Scenario(
		'Creating custom view filters with valid values',
		({ When, Then }) => {
			let value: string[];
			When('I create custom view filters with ["active", "pending"]', () => {
				value = new ValueObjects.CustomViewFilters([
					'active',
					'pending',
				]).valueOf();
			});
			Then('the value should be ["active", "pending"]', () => {
				expect(value).toEqual(['active', 'pending']);
			});
		},
	);

	Scenario(
		'Creating custom view filters with a single valid value',
		({ When, Then }) => {
			let value: string[];
			When('I create custom view filters with ["active"]', () => {
				value = new ValueObjects.CustomViewFilters(['active']).valueOf();
			});
			Then('the value should be ["active"]', () => {
				expect(value).toEqual(['active']);
			});
		},
	);

	Scenario(
		'Creating custom view filters with maximum allowed items',
		({ When, Then }) => {
			let value: string[];
			When(
				'I create custom view filters with an array of 100 valid strings',
				() => {
					value = new ValueObjects.CustomViewFilters(
						Array(100).fill('filter'),
					).valueOf();
				},
			);
			Then('the value should be the 100 string array', () => {
				expect(value).toEqual(Array(100).fill('filter'));
			});
		},
	);

	Scenario(
		'Creating custom view filters with more than maximum allowed items',
		({ When, Then }) => {
			let createFilters: () => void;
			When(
				'I try to create custom view filters with an array of 101 valid strings',
				() => {
					createFilters = () => {
						new ValueObjects.CustomViewFilters(
							Array(101).fill('filter'),
						).valueOf();
					};
				},
			);
			Then(
				'an error should be thrown indicating the custom view filters are too long',
				() => {
					expect(createFilters).toThrow('Too long');
				},
			);
		},
	);

	Scenario(
		'Creating custom view filters with an item that is too long',
		({ When, Then }) => {
			let createFilters: () => void;
			When('I try to create custom view filters with ["a".repeat(501)]', () => {
				createFilters = () => {
					new ValueObjects.CustomViewFilters(['a'.repeat(501)]).valueOf();
				};
			});
			Then(
				'an error should be thrown indicating the custom view filter is too long',
				() => {
					try {
						createFilters();
					} catch (e) {
						if (
							Array.isArray(e) &&
							e.length > 0 &&
							// biome-ignore lint/plugin/no-type-assertion: test file
							(e[0] as VOError).message === 'Too long'
						) {
							return;
						}
						throw e;
					}
					throw new Error('Expected error was not thrown');
				},
			);
		},
	);

	Scenario(
		'Creating custom view filters with an empty array',
		({ When, Then }) => {
			let value: string[];
			When('I create custom view filters with an empty array', () => {
				value = new ValueObjects.CustomViewFilters([]).valueOf();
			});
			Then('the value should be []', () => {
				expect(value).toEqual([]);
			});
		},
	);

	Scenario('Creating custom view filters with null', ({ When, Then }) => {
		let createFilters: () => void;
		When('I try to create custom view filters with null', () => {
			createFilters = () => {
				// @ts-expect-error
				new ValueObjects.CustomViewFilters(null).valueOf();
			};
		});
		Then(
			'an error should be thrown indicating the custom view filters are invalid',
			() => {
				expect(createFilters).toThrow(/Wrong raw value type/i);
			},
		);
	});

	Scenario('Creating custom view filters with undefined', ({ When, Then }) => {
		let createFilters: () => void;
		When('I try to create custom view filters with undefined', () => {
			createFilters = () => {
				// @ts-expect-error
				new ValueObjects.CustomViewFilters(undefined).valueOf();
			};
		});
		Then(
			'an error should be thrown indicating the custom view filters are invalid',
			() => {
				expect(createFilters).toThrow(/Wrong raw value type/i);
			},
		);
	});

	// CustomViewColumnsToDisplay
	Scenario(
		'Creating custom view columns to display with valid values',
		({ When, Then }) => {
			let value: string[];
			When(
				'I create custom view columns to display with ["name", "email"]',
				() => {
					value = new ValueObjects.CustomViewColumnsToDisplay([
						'name',
						'email',
					]).valueOf();
				},
			);
			Then('the value should be ["name", "email"]', () => {
				expect(value).toEqual(['name', 'email']);
			});
		},
	);

	Scenario(
		'Creating custom view columns to display with a single valid value',
		({ When, Then }) => {
			let value: string[];
			When('I create custom view columns to display with ["name"]', () => {
				value = new ValueObjects.CustomViewColumnsToDisplay(['name']).valueOf();
			});
			Then('the value should be ["name"]', () => {
				expect(value).toEqual(['name']);
			});
		},
	);

	Scenario(
		'Creating custom view columns to display with maximum allowed items',
		({ When, Then }) => {
			let value: string[];
			When(
				'I create custom view columns to display with an array of 30 valid strings',
				() => {
					value = new ValueObjects.CustomViewColumnsToDisplay(
						Array(30).fill('col'),
					).valueOf();
				},
			);
			Then('the value should be the 30 string array', () => {
				expect(value).toEqual(Array(30).fill('col'));
			});
		},
	);

	Scenario(
		'Creating custom view columns to display with more than maximum allowed items',
		({ When, Then }) => {
			let createColumns: () => void;
			When(
				'I try to create custom view columns to display with an array of 31 valid strings',
				() => {
					createColumns = () => {
						new ValueObjects.CustomViewColumnsToDisplay(
							Array(31).fill('col'),
						).valueOf();
					};
				},
			);
			Then(
				'an error should be thrown indicating the custom view columns to display are too long',
				() => {
					expect(createColumns).toThrow('Too long');
				},
			);
		},
	);

	Scenario(
		'Creating custom view columns to display with an item that is too long',
		({ When, Then }) => {
			let createColumns: () => void;
			When(
				'I try to create custom view columns to display with ["a".repeat(501)]',
				() => {
					createColumns = () => {
						new ValueObjects.CustomViewColumnsToDisplay([
							'a'.repeat(501),
						]).valueOf();
					};
				},
			);
			Then(
				'an error should be thrown indicating the custom view column to display is too long',
				() => {
					try {
						createColumns();
					} catch (e) {
						if (
							Array.isArray(e) &&
							e.length > 0 &&
							// biome-ignore lint/plugin/no-type-assertion: test file
							(e[0] as VOError).message === 'Too long'
						) {
							return;
						}
						throw e;
					}
					throw new Error('Expected error was not thrown');
				},
			);
		},
	);

	Scenario(
		'Creating custom view columns to display with an empty array',
		({ When, Then }) => {
			let value: string[];
			When(
				'I create custom view columns to display with an empty array',
				() => {
					value = new ValueObjects.CustomViewColumnsToDisplay([]).valueOf();
				},
			);
			Then('the value should be []', () => {
				expect(value).toEqual([]);
			});
		},
	);

	Scenario(
		'Creating custom view columns to display with null',
		({ When, Then }) => {
			let createColumns: () => void;
			When('I try to create custom view columns to display with null', () => {
				createColumns = () => {
					// @ts-expect-error
					new ValueObjects.CustomViewColumnsToDisplay(null).valueOf();
				};
			});
			Then(
				'an error should be thrown indicating the custom view columns to display are invalid',
				() => {
					expect(createColumns).toThrow(/Wrong raw value type/i);
				},
			);
		},
	);

	Scenario(
		'Creating custom view columns to display with undefined',
		({ When, Then }) => {
			let createColumns: () => void;
			When(
				'I try to create custom view columns to display with undefined',
				() => {
					createColumns = () => {
						// @ts-expect-error
						new ValueObjects.CustomViewColumnsToDisplay(undefined).valueOf();
					};
				},
			);
			Then(
				'an error should be thrown indicating the custom view columns to display are invalid',
				() => {
					expect(createColumns).toThrow(/Wrong raw value type/i);
				},
			);
		},
	);
});
