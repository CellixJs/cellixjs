import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { PermissionError } from '@cellix/domain-seedwork/domain-entity';
import { expect, vi } from 'vitest';
import { EndUserCreatedEvent } from '../../../events/types/end-user-created.ts';
import type { Passport } from '../../passport.ts';
import { EndUser, type EndUserProps } from './end-user.ts';

const test = { for: describeFeature };
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feature = await loadFeature(
	path.resolve(__dirname, 'features/end-user.feature'),
);

function makePassport(
	canManageEndUsers = false,
	isEditingOwnAccount = false,
): Passport {
	return vi.mocked({
		user: {
			forEndUser: vi.fn(() => ({
				determineIf: (
					fn: (p: {
						canManageEndUsers: boolean;
						isEditingOwnAccount: boolean;
					}) => boolean,
				) => fn({ canManageEndUsers, isEditingOwnAccount }),
			})),
		},
	// biome-ignore lint/plugin/no-type-assertion: test file
	} as unknown as Passport);
}

function makeBaseProps(overrides: Partial<EndUserProps> = {}): EndUserProps {
	return {
		id: 'user-1',
		email: 'alice@cellix.com',
		displayName: 'Alice Smith',
		externalId: '123e4567-e89b-12d3-a456-426614174000',
		accessBlocked: false,
		tags: [],
		userType: 'end-user',
		createdAt: new Date('2020-01-01T00:00:00Z'),
		updatedAt: new Date('2020-01-02T00:00:00Z'),
		schemaVersion: '1.0.0',
		personalInformation: {
			identityDetails: {
				lastName: 'Smith',
				legalNameConsistsOfOneName: false,
				restOfName: 'Alice',
			},
			contactInformation: {
				email: 'alice@cellix.com',
			},
		},
		...overrides,
	};
}

function getIntegrationEvent<T>(
	events: readonly unknown[],
	eventClass: new (aggregateId: string) => T,
): T | undefined {
	// biome-ignore lint/plugin/no-type-assertion: test file
	return events.find((e) => e instanceof eventClass) as T | undefined;
}

test.for(feature, ({ Scenario, Background, BeforeEachScenario }) => {
	let passport: Passport;
	let baseProps: EndUserProps;
	let endUser: EndUser<EndUserProps>;
	let newEndUser: EndUser<EndUserProps>;

	BeforeEachScenario(() => {
		passport = makePassport(true, true);
		baseProps = makeBaseProps();
		endUser = new EndUser(baseProps, passport);
		// biome-ignore lint/plugin/no-type-assertion: test file
		newEndUser = undefined as unknown as EndUser<EndUserProps>;
	});

	Background(({ Given, And }) => {
		Given('a valid Passport with end user permissions', () => {
			passport = makePassport(true, true);
		});
		And(
			'base end user properties with email "alice@cellix.com", displayName "Alice Smith", externalId "123e4567-e89b-12d3-a456-426614174000", accessBlocked false, tags [], userType "end-user", and valid timestamps',
			() => {
				baseProps = makeBaseProps();
				endUser = new EndUser(baseProps, passport);
			},
		);
	});

	Scenario(
		'Creating a new end user instance with restOfName',
		({ When, Then, And }) => {
			When(
				'I create a new EndUser aggregate using getNewInstance with externalId "123e4567-e89b-12d3-a456-426614174000", lastName "Smith", restOfName "Alice", and email "alice@cellix.com"',
				() => {
					newEndUser = EndUser.getNewInstance(
						makeBaseProps(),
						passport,
						'123e4567-e89b-12d3-a456-426614174000',
						'Smith',
						'Alice',
						'alice@cellix.com',
					);
				},
			);
			Then(
				'the end user\'s externalId should be "123e4567-e89b-12d3-a456-426614174000"',
				() => {
					expect(newEndUser.externalId).toBe(
						'123e4567-e89b-12d3-a456-426614174000',
					);
				},
			);
			And('the end user\'s displayName should be "Alice Smith"', () => {
				expect(newEndUser.displayName).toBe('Alice Smith');
			});
			And('a EndUserCreatedEvent should be added to integration events', () => {
				const event = getIntegrationEvent(
					newEndUser.getIntegrationEvents(),
					EndUserCreatedEvent,
				);
				expect(event).toBeDefined();
				expect(event).toBeInstanceOf(EndUserCreatedEvent);
			});
		},
	);

	Scenario(
		'Creating a new end user instance with no restOfName',
		({ When, Then, And }) => {
			When(
				'I create a new EndUser aggregate using getNewInstance with externalId "123e4567-e89b-12d3-a456-426614174000", lastName "Smith", restOfName "", and email "alice@cellix.com"',
				() => {
					newEndUser = EndUser.getNewInstance(
						makeBaseProps(),
						passport,
						'123e4567-e89b-12d3-a456-426614174000',
						'Smith',
						'',
						'alice@cellix.com',
					);
				},
			);
			Then('the end user\'s displayName should be "Smith"', () => {
				expect(newEndUser.displayName).toBe('Smith');
			});
			And(
				'the end user\'s externalId should be "123e4567-e89b-12d3-a456-426614174000"',
				() => {
					expect(newEndUser.externalId).toBe(
						'123e4567-e89b-12d3-a456-426614174000',
					);
				},
			);
			And('a EndUserCreatedEvent should be added to integration events', () => {
				const event = getIntegrationEvent(
					newEndUser.getIntegrationEvents(),
					EndUserCreatedEvent,
				);
				expect(event).toBeDefined();
				expect(event).toBeInstanceOf(EndUserCreatedEvent);
			});
		},
	);

	// email
	Scenario('Changing the email with permission', ({ Given, When, Then }) => {
		Given('an EndUser aggregate with permission to edit own account', () => {
			passport = makePassport(false, true);
			endUser = new EndUser(makeBaseProps(), passport);
		});
		When('I set the email to "bob@cellix.com"', () => {
			endUser.email = 'bob@cellix.com';
		});
		Then('the end user\'s email should be "bob@cellix.com"', () => {
			expect(endUser.email).toBe('bob@cellix.com');
		});
	});

	Scenario('Changing the email without permission', ({ Given, When, Then }) => {
		let changingEmailWithoutPermission: () => void;
		Given(
			'an EndUser aggregate without permission to edit own account or manage end users',
			() => {
				passport = makePassport(false, false);
				endUser = new EndUser(makeBaseProps(), passport);
			},
		);
		When('I try to set the email to "bob@cellix.com"', () => {
			changingEmailWithoutPermission = () => {
				endUser.email = 'bob@cellix.com';
			};
		});
		Then('a PermissionError should be thrown', () => {
			expect(changingEmailWithoutPermission).toThrow(PermissionError);
			expect(changingEmailWithoutPermission).throws('Unauthorized');
		});
	});

	Scenario(
		'Changing the email to an invalid email address',
		({ Given, When, Then }) => {
			let changingEmailToInvalidEmailAddress: () => void;
			Given('an EndUser aggregate with permission to edit own account', () => {
				passport = makePassport(false, true);
				endUser = new EndUser(makeBaseProps(), passport);
			});
			When('I try to set the email to "not-an-email"', () => {
				changingEmailToInvalidEmailAddress = () => {
					endUser.email = 'not-an-email';
				};
			});
			Then('an error should be thrown indicating the email is invalid', () => {
				expect(changingEmailToInvalidEmailAddress).throws(
					"Value doesn't match pattern",
				);
			});
		},
	);

	// displayName
	Scenario(
		'Changing the displayName with permission',
		({ Given, When, Then }) => {
			Given('an EndUser aggregate with permission to edit own account', () => {
				passport = makePassport(false, true);
				endUser = new EndUser(makeBaseProps(), passport);
			});
			When('I set the displayName to "Alice J. Smith"', () => {
				endUser.displayName = 'Alice J. Smith';
			});
			Then('the end user\'s displayName should be "Alice J. Smith"', () => {
				expect(endUser.displayName).toBe('Alice J. Smith');
			});
		},
	);

	Scenario(
		'Changing the displayName without permission',
		({ Given, When, Then }) => {
			let changingDisplayNameWithoutPermission: () => void;
			Given(
				'an EndUser aggregate without permission to edit own account or manage end users',
				() => {
					passport = makePassport(false, false);
					endUser = new EndUser(makeBaseProps(), passport);
				},
			);
			When('I try to set the displayName to "Alice J. Smith"', () => {
				changingDisplayNameWithoutPermission = () => {
					endUser.displayName = 'Alice J. Smith';
				};
			});
			Then('a PermissionError should be thrown', () => {
				expect(changingDisplayNameWithoutPermission).toThrow(PermissionError);
				expect(changingDisplayNameWithoutPermission).throws('Unauthorized');
			});
		},
	);

	Scenario(
		'Changing the displayName to an invalid value',
		({ Given, When, Then }) => {
			let changingDisplayNameToInvalidValue: () => void;
			Given('an EndUser aggregate with permission to edit own account', () => {
				passport = makePassport(false, true);
				endUser = new EndUser(makeBaseProps(), passport);
			});
			When('I try to set the displayName to an empty string', () => {
				changingDisplayNameToInvalidValue = () => {
					endUser.displayName = '';
				};
			});
			Then(
				'an error should be thrown indicating the displayName is too short',
				() => {
					expect(changingDisplayNameToInvalidValue).throws('Too short');
				},
			);
		},
	);

	// externalId
	Scenario(
		'Setting the externalId during creation',
		({ Given, When, Then }) => {
			Given('valid dependencies for a new EndUser aggregate', () => {
				passport = makePassport(false, true);
				baseProps = makeBaseProps();
			});
			When(
				'I set the externalId to "123e4567-e89b-12d3-a456-426614174001" during creation',
				() => {
					newEndUser = EndUser.getNewInstance(
						baseProps,
						passport,
						'123e4567-e89b-12d3-a456-426614174001',
						'Smith',
						'Alice',
						'alice@cellix.com',
					);
				},
			);
			Then(
				'the end user\'s externalId should be "123e4567-e89b-12d3-a456-426614174001"',
				() => {
					expect(newEndUser.externalId).toBe(
						'123e4567-e89b-12d3-a456-426614174001',
					);
				},
			);
		},
	);

	Scenario(
		'Providing an invalid externalId during creation',
		({ Given, When, Then }) => {
			let createEndUserWithInvalidExternalId: () => void;
			Given('valid dependencies for a new EndUser aggregate', () => {
				passport = makePassport(false, true);
				baseProps = makeBaseProps();
			});
			When('I try to create a new EndUser with an invalid externalId', () => {
				createEndUserWithInvalidExternalId = () => {
					EndUser.getNewInstance(
						baseProps,
						passport,
						'a'.repeat(36), // Invalid externalId
						'Smith',
						'Alice',
						'alice@cellix.com',
					);
				};
			});
			Then(
				'an error should be thrown indicating the externalId is invalid',
				() => {
					expect(createEndUserWithInvalidExternalId).throws(
						"Value doesn't match pattern",
					);
				},
			);
		},
	);

	Scenario(
		'Changing the externalId after creation',
		({ Given, When, Then }) => {
			let setExternalId: () => void;
			Given('an existing EndUser aggregate', () => {
				passport = makePassport(false, true);
				endUser = new EndUser(makeBaseProps(), passport);
			});
			When(
				'I try to set the externalId to "123e4567-e89b-12d3-a456-426614174002" after creation',
				() => {
					setExternalId = () => {
						endUser.externalId = '123e4567-e89b-12d3-a456-426614174002';
					};
				},
			);
			Then(
				'an error should be thrown indicating personal information cannot be set',
				() => {
					expect(setExternalId).throws('Cannot set personal information');
				},
			);
		},
	);

	// accessBlocked
	Scenario(
		'Changing accessBlocked with elevated permission',
		({ Given, When, Then }) => {
			Given('an EndUser aggregate with permission to manage end users', () => {
				passport = makePassport(true, false);
				endUser = new EndUser(makeBaseProps(), passport);
			});
			When('I set accessBlocked to true', () => {
				endUser.accessBlocked = true;
			});
			Then("the end user's accessBlocked should be true", () => {
				expect(endUser.accessBlocked).toBe(true);
			});
		},
	);

	Scenario(
		'Changing accessBlocked without elevated permission',
		({ Given, When, Then }) => {
			let changingAccessBlockedWithoutPermission: () => void;
			Given(
				'an EndUser aggregate without permission to manage end users',
				() => {
					passport = makePassport(false, true);
					endUser = new EndUser(makeBaseProps(), passport);
				},
			);
			When('I try to set accessBlocked to true', () => {
				changingAccessBlockedWithoutPermission = () => {
					endUser.accessBlocked = true;
				};
			});
			Then('a PermissionError should be thrown', () => {
				expect(changingAccessBlockedWithoutPermission).toThrow(PermissionError);
				expect(changingAccessBlockedWithoutPermission).throws('Unauthorized');
			});
		},
	);

	// tags
	Scenario(
		'Changing tags with elevated permission',
		({ Given, When, Then }) => {
			Given('an EndUser aggregate with permission to manage end users', () => {
				passport = makePassport(true, false);
				endUser = new EndUser(makeBaseProps(), passport);
			});
			When('I set tags to ["tag1", "tag2"]', () => {
				endUser.tags = ['tag1', 'tag2'];
			});
			Then('the end user\'s tags should be ["tag1", "tag2"]', () => {
				expect(endUser.tags).toEqual(['tag1', 'tag2']);
			});
		},
	);

	Scenario(
		'Changing tags without elevated permission',
		({ Given, When, Then }) => {
			let changingTagsWithoutPermission: () => void;
			Given(
				'an EndUser aggregate without permission to manage end users',
				() => {
					passport = makePassport(false, false);
					endUser = new EndUser(makeBaseProps(), passport);
				},
			);
			When('I try to set tags to ["tag1", "tag2"]', () => {
				changingTagsWithoutPermission = () => {
					endUser.tags = ['tag1', 'tag2'];
				};
			});
			Then('a PermissionError should be thrown', () => {
				expect(changingTagsWithoutPermission).toThrow(PermissionError);
				expect(changingTagsWithoutPermission).throws('Unauthorized');
			});
		},
	);

	// readonly properties
	Scenario(
		'Getting userType, createdAt, updatedAt, and schemaVersion',
		({ Given, Then, And }) => {
			Given('an EndUser aggregate', () => {
				passport = makePassport(false, true);
				endUser = new EndUser(makeBaseProps(), passport);
			});
			Then('the userType property should return the correct type', () => {
				expect(endUser.userType).toBe('end-user');
			});
			And('the createdAt property should return the correct date', () => {
				expect(endUser.createdAt).toEqual(expect.any(Date));
				expect(endUser.createdAt.toISOString()).toBe(
					'2020-01-01T00:00:00.000Z',
				);
			});
			And('the updatedAt property should return the correct date', () => {
				expect(endUser.updatedAt).toEqual(expect.any(Date));
				expect(endUser.updatedAt.toISOString()).toBe(
					'2020-01-02T00:00:00.000Z',
				);
			});
			And(
				'the schemaVersion property should return the correct version',
				() => {
					expect(endUser.schemaVersion).toBe('1.0.0');
				},
			);
		},
	);
});
