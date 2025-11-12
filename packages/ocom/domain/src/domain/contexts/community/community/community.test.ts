import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import * as DomainSeedwork from '@cellix/domain-seedwork/domain-seedwork';
import { expect, vi } from 'vitest';
import { CommunityCreatedEvent } from '../../../events/types/community-created.ts';
import { CommunityDomainUpdatedEvent } from '../../../events/types/community-domain-updated.ts';
import type { Passport } from '../../passport.ts';
import type { EndUserEntityReference } from '../../user/end-user/end-user.ts';
import { Community, type CommunityProps } from './community.ts';

const test = { for: describeFeature };
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feature = await loadFeature(
	path.resolve(__dirname, 'features/community.feature'),
);

function makePassport(canManageCommunitySettings = true): Passport {
	return vi.mocked({
		community: {
			forCommunity: vi.fn(() => ({
				determineIf: (
					fn: (p: { canManageCommunitySettings: boolean }) => boolean,
				) => fn({ canManageCommunitySettings }),
			})),
		},
		user: {
			forEndUser: vi.fn(() => ({
				determineIf: (fn: (p: { canManageEndUsers: boolean }) => boolean) =>
					fn({ canManageEndUsers: true }),
			})),
		},
	} as unknown as Passport);
}

function makeEndUserEntityReference(id: string): EndUserEntityReference {
	return {
		id,
		userType: 'end-user',
		displayName: 'Test User',
	} as EndUserEntityReference;
}

function makeBaseProps(
	overrides: Partial<CommunityProps> = {},
): CommunityProps {
	return {
		id: 'community-1',
		name: 'Test Community',
		domain: 'test.com',
		whiteLabelDomain: 'wl.test.com',
		handle: 'testhandle',
		createdBy: makeEndUserEntityReference('user1'),
		loadCreatedBy: async () => makeEndUserEntityReference('user1'),
		createdAt: new Date('2020-01-01T00:00:00Z'),
		updatedAt: new Date('2020-01-02T00:00:00Z'),
		schemaVersion: '1.0.0',
		...overrides,
	};
}

function findEvent<T>(
	events: readonly unknown[],
	eventClass: new (aggregateId: string) => T,
): T | undefined {
	return events.find((e) => e instanceof eventClass) as T | undefined;
}

test.for(feature, ({ Scenario, Background, BeforeEachScenario }) => {
	let passport: Passport;
	let baseProps: CommunityProps;
	let community: Community<CommunityProps>;
	let newCommunity: Community<CommunityProps>;

	BeforeEachScenario(() => {
		passport = makePassport(true);
		baseProps = makeBaseProps();
		community = new Community(baseProps, passport);
		newCommunity = undefined as unknown as Community<CommunityProps>;
	});

	Background(({ Given, And }) => {
		Given('a valid Passport with community permissions', () => {
			passport = makePassport(true);
		});
		And('a valid EndUserEntityReference for "user1"', () => {
			// Already handled in makeBaseProps
		});
		And(
			'base community properties with name "Test Community", domain "test.com", whiteLabelDomain "wl.test.com", handle "testhandle", createdBy "user1", and valid timestamps',
			() => {
				baseProps = makeBaseProps();
				community = new Community(baseProps, passport);
			},
		);
	});

	Scenario('Creating a new community instance', ({ When, Then, And }) => {
		When(
			'I create a new Community aggregate using getNewInstance with name "New Community" and createdBy "user1"',
			() => {
				newCommunity = Community.getNewInstance(
					makeBaseProps(),
					'New Community',
					makeEndUserEntityReference('user1'),
					passport,
				);
			},
		);
		Then('the community\'s name should be "New Community"', () => {
			expect(newCommunity.name).toBe('New Community');
		});
		And('the community\'s createdBy should reference "user1"', () => {
			expect(newCommunity.createdBy.id).toBe('user1');
		});
		And('a CommunityCreatedEvent should be emitted', () => {
			const event = findEvent(
				newCommunity.getIntegrationEvents(),
				CommunityCreatedEvent,
			);
			expect(event).toBeDefined();
			expect(event).toBeInstanceOf(CommunityCreatedEvent);
			expect(event?.payload.communityId).toBe(newCommunity.props.id);
		});
	});

	Scenario(
		'Changing the name with permission to manage community settings',
		({ Given, When, Then }) => {
			Given(
				'a Community aggregate with permission to manage community settings',
				() => {
					passport = makePassport(true);
					community = new Community(makeBaseProps(), passport);
				},
			);
			When('I set the name to "Updated Name"', () => {
				community.name = 'Updated Name';
			});
			Then('the community\'s name should be "Updated Name"', () => {
				expect(community.name).toBe('Updated Name');
			});
		},
	);

	Scenario('Changing the name without permission', ({ Given, When, Then }) => {
		let changingNameWithoutPermission: () => void;
		Given(
			'a Community aggregate without permission to manage community settings',
			() => {
				passport = makePassport(false);
				community = new Community(makeBaseProps(), passport);
			},
		);
		When('I try to set the name to "Updated Name"', () => {
			changingNameWithoutPermission = () => {
				community.name = 'Updated Name';
			};
		});
		Then('a PermissionError should be thrown', () => {
			expect(changingNameWithoutPermission).toThrow(
				DomainSeedwork.PermissionError,
			);
			expect(changingNameWithoutPermission).toThrow(
				'You do not have permission to change the name of this community',
			);
		});
	});

	Scenario('Changing the name to an invalid value', ({ Given, When, Then }) => {
		let changingNameToNull: () => void;
		let changingNameToEmptyString: () => void;
		Given(
			'a Community aggregate with permission to manage community settings',
			() => {
				passport = makePassport(true);
				community = new Community(makeBaseProps(), passport);
			},
		);
		When(
			'I try to set the name to an invalid value (e.g., null or empty string)',
			() => {
				changingNameToNull = () => {
					// @ts-expect-error
					community.name = null;
				};
				changingNameToEmptyString = () => {
					community.name = '';
				};
			},
		);
		Then('an error should be thrown indicating the value is invalid', () => {
			expect(changingNameToNull).throws('Wrong raw value type');
			expect(changingNameToEmptyString).throws('Too short');
		});
	});

	Scenario(
		'Changing the domain with permission to manage community settings',
		({ Given, When, Then, And }) => {
			Given(
				'a Community aggregate with permission to manage community settings',
				() => {
					passport = makePassport(true);
					community = new Community(makeBaseProps(), passport);
				},
			);
			When('I set the domain to "updated.com"', () => {
				community.domain = 'updated.com';
			});
			Then('the community\'s domain should be "updated.com"', () => {
				expect(community.domain).toBe('updated.com');
			});
			And(
				'a CommunityDomainUpdatedEvent should be emitted with the new and old domain',
				() => {
					const event = findEvent(
						community.getIntegrationEvents(),
						CommunityDomainUpdatedEvent,
					);
					expect(event).toBeDefined();
					expect(event).toBeInstanceOf(CommunityDomainUpdatedEvent);
					expect(event?.payload.domain).toBe('updated.com');
					expect(event?.payload.oldDomain).toBe('test.com');
				},
			);
		},
	);

	Scenario(
		'Changing the domain without permission',
		({ Given, When, Then, And }) => {
			let changingDomainWithoutPermission: () => void;
			Given(
				'a Community aggregate without permission to manage community settings',
				() => {
					passport = makePassport(false);
					community = new Community(makeBaseProps(), passport);
				},
			);
			When('I try to set the domain to "updated.com"', () => {
				changingDomainWithoutPermission = () => {
					community.domain = 'updated.com';
				};
			});
			Then('a PermissionError should be thrown', () => {
				expect(changingDomainWithoutPermission).toThrow(
					DomainSeedwork.PermissionError,
				);
				expect(changingDomainWithoutPermission).throws(
					'You do not have permission to change the domain of this community',
				);
			});
			And('no CommunityDomainUpdatedEvent should be emitted', () => {
				const event = findEvent(
					community.getIntegrationEvents(),
					CommunityDomainUpdatedEvent,
				);
				expect(event).toBeUndefined();
			});
		},
	);

	Scenario(
		'Changing the domain to an invalid value',
		({ Given, When, Then, And }) => {
			let changingDomainToNull: () => void;
			let changingDomainToEmptyString: () => void;
			Given(
				'a Community aggregate with permission to manage community settings',
				() => {
					passport = makePassport(true);
					community = new Community(makeBaseProps(), passport);
				},
			);
			When(
				'I try to set the domain to an invalid value (e.g., null or empty string)',
				() => {
					changingDomainToNull = () => {
						// @ts-expect-error
						community.domain = null;
					};
					changingDomainToEmptyString = () => {
						community.domain = '';
					};
				},
			);
			Then('an error should be thrown indicating the value is invalid', () => {
				expect(changingDomainToNull).toThrow();
				expect(changingDomainToNull).throws('Wrong raw value type');
				expect(changingDomainToEmptyString).toThrow();
				expect(changingDomainToEmptyString).throws('Too short');
			});
			And('no CommunityDomainUpdatedEvent should be emitted', () => {
				const event = findEvent(
					community.getIntegrationEvents(),
					CommunityDomainUpdatedEvent,
				);
				expect(event).toBeUndefined();
			});
		},
	);

	Scenario(
		'Changing the domain to the same value',
		({ Given, When, Then, And }) => {
			Given(
				'a Community aggregate with permission to manage community settings',
				() => {
					passport = makePassport(true);
					community = new Community(makeBaseProps(), passport);
				},
			);
			When('I set the domain to its current value', () => {
				community.domain = 'test.com';
			});
			Then('no CommunityDomainUpdatedEvent should be emitted', () => {
				const event = findEvent(
					community.getIntegrationEvents(),
					CommunityDomainUpdatedEvent,
				);
				expect(event).toBeUndefined();
			});
			And("the community's domain should remain unchanged", () => {
				expect(community.domain).toBe('test.com');
			});
		},
	);

	Scenario(
		'Changing the white label domain with permission to manage community settings',
		({ Given, When, Then }) => {
			Given(
				'a Community aggregate with permission to manage community settings',
				() => {
					passport = makePassport(true);
					community = new Community(makeBaseProps(), passport);
				},
			);
			When('I set the whiteLabelDomain to "newwl.com"', () => {
				community.whiteLabelDomain = 'newwl.com';
			});
			Then('the community\'s whiteLabelDomain should be "newwl.com"', () => {
				expect(community.whiteLabelDomain).toBe('newwl.com');
			});
		},
	);

	Scenario(
		'Changing the white label domain without permission',
		({ Given, When, Then }) => {
			let updatingWhiteLabelDomainWithoutPermission: () => void;
			Given(
				'a Community aggregate without permission to manage community settings',
				() => {
					passport = makePassport(false);
					community = new Community(makeBaseProps(), passport);
				},
			);
			When('I try to set the whiteLabelDomain to "newwl.com"', () => {
				updatingWhiteLabelDomainWithoutPermission = () => {
					community.whiteLabelDomain = 'newwl.com';
				};
			});
			Then('a PermissionError should be thrown', () => {
				expect(updatingWhiteLabelDomainWithoutPermission).toThrow(
					DomainSeedwork.PermissionError,
				);
				expect(updatingWhiteLabelDomainWithoutPermission).throws(
					'You do not have permission to change the white label domain of this community',
				);
			});
		},
	);

	Scenario(
		'Changing the white label domain to an invalid value',
		({ Given, When, Then }) => {
			let changingWhiteLabelDomainToUndefined: () => void;
			let changingWhiteLabelDomainToEmptyString: () => void;
			Given(
				'a Community aggregate with permission to manage community settings',
				() => {
					passport = makePassport(true);
					community = new Community(makeBaseProps(), passport);
				},
			);
			When(
				'I try to set the whiteLabelDomain to an invalid value (e.g., undefined or empty string)',
				() => {
					changingWhiteLabelDomainToUndefined = () => {
						// @ts-expect-error
						community.whiteLabelDomain = undefined;
					};
					changingWhiteLabelDomainToEmptyString = () => {
						community.whiteLabelDomain = '';
					};
				},
			);
			Then('an error should be thrown indicating the value is invalid', () => {
				expect(changingWhiteLabelDomainToUndefined).toThrow();
				expect(changingWhiteLabelDomainToUndefined).throws(
					'Wrong raw value type',
				);
				expect(changingWhiteLabelDomainToEmptyString).toThrow();
				expect(changingWhiteLabelDomainToEmptyString).throws('Too short');
			});
		},
	);

	Scenario(
		'Changing the handle with permission to manage community settings',
		({ Given, When, Then }) => {
			Given(
				'a Community aggregate with permission to manage community settings',
				() => {
					passport = makePassport(true);
					community = new Community(makeBaseProps(), passport);
				},
			);
			When('I set the handle to "newhandle"', () => {
				community.handle = 'newhandle';
			});
			Then('the community\'s handle should be "newhandle"', () => {
				expect(community.handle).toBe('newhandle');
			});
		},
	);

	Scenario(
		'Changing the handle without permission',
		({ Given, When, Then }) => {
			let updatingHandleWithoutPermission: () => void;
			Given(
				'a Community aggregate without permission to manage community settings',
				() => {
					passport = makePassport(false);
					community = new Community(makeBaseProps(), passport);
				},
			);
			When('I try to set the handle to "newhandle"', () => {
				updatingHandleWithoutPermission = () => {
					community.handle = 'newhandle';
				};
			});
			Then('a PermissionError should be thrown', () => {
				expect(updatingHandleWithoutPermission).toThrow(
					DomainSeedwork.PermissionError,
				);
				expect(updatingHandleWithoutPermission).throws(
					'You do not have permission to change the handle of this community',
				);
			});
		},
	);

	Scenario(
		'Changing the handle to an invalid value',
		({ Given, When, Then }) => {
			let changingHandleToUndefined: () => void;
			let changingHandleToEmptyString: () => void;
			Given(
				'a Community aggregate with permission to manage community settings',
				() => {
					passport = makePassport(true);
					community = new Community(makeBaseProps(), passport);
				},
			);
			When(
				'I try to set the handle to an invalid value (e.g. undefined or empty string)',
				() => {
					changingHandleToUndefined = () => {
						// @ts-expect-error
						community.handle = undefined;
					};
					changingHandleToEmptyString = () => {
						community.handle = '';
					};
				},
			);
			Then('an error should be thrown indicating the value is invalid', () => {
				expect(changingHandleToUndefined).throws('Wrong raw value type');
				expect(changingHandleToEmptyString).throws('Too short');
			});
		},
	);

	Scenario(
		'Getting createdAt, updatedAt, and schemaVersion',
		({ Given, Then, And }) => {
			Given('a Community aggregate', () => {
				passport = makePassport(true);
				baseProps = makeBaseProps();
				community = new Community(baseProps, passport);
			});
			Then('the createdAt property should return the correct date', () => {
				expect(community.createdAt).toEqual(new Date('2020-01-01T00:00:00Z'));
			});
			And('the updatedAt property should return the correct date', () => {
				expect(community.updatedAt).toEqual(new Date('2020-01-02T00:00:00Z'));
			});
			And(
				'the schemaVersion property should return the correct version',
				() => {
					expect(community.schemaVersion).toBe('1.0.0');
				},
			);
		},
	);
});
