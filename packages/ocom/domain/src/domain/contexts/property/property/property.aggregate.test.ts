import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { PermissionError } from '@cellix/domain-seedwork/domain-entity';
import type { PropArray } from '@cellix/domain-seedwork/prop-array';
import { expect, vi } from 'vitest';
import type {
	CommunityEntityReference,
	CommunityProps,
	MemberEntityReference,
	MemberAccountEntityReference,
	MemberCustomViewEntityReference,
	MemberProfileProps,
	EndUserRoleEntityReference,
} from '../../community.ts';
import type { Passport } from '../../passport.ts';
import type { EndUserEntityReference } from '../../user.ts';
import type { PropertyLocationAddressProps } from '../../property.ts';
import { Property, type PropertyProps } from './property.aggregate.ts';
import type { PropertyListingDetailProps } from './property-listing-detail.entity.ts';
import type { PropertyListingDetailAdditionalAmenityProps } from './property-listing-detail-additional-amenity.entity.ts';
import type { PropertyListingDetailBedroomDetailProps } from './property-listing-detail-bedroom-detail.entity.ts';
import type { PropertyLocationProps } from './property-location.entity.ts';

const test = { for: describeFeature };
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feature = await loadFeature(
	path.resolve(__dirname, 'features/property.aggregate.feature'),
);

function makePassport(
	overrides: Partial<{
		canManageProperties: boolean;
		canEditOwnProperty: boolean;
		isEditingOwnProperty: boolean;
	}> = {},
) {
	return vi.mocked({
		community: {
			forCommunity: vi.fn(),
		},
		property: {
			forProperty: vi.fn(() => ({
				determineIf: (
					fn: (p: {
						canManageProperties: boolean;
						canEditOwnProperty: boolean;
						isEditingOwnProperty: boolean;
						isSystemAccount: boolean;
					}) => boolean,
				) =>
					fn({
						canManageProperties: overrides.canManageProperties ?? true,
						canEditOwnProperty: overrides.canEditOwnProperty ?? false,
						isEditingOwnProperty: overrides.isEditingOwnProperty ?? false,
						isSystemAccount: false,
					}),
			})),
		},
	} as unknown as Passport);
}

function makeCommunityEntityReference(
	id = 'community-1',
): CommunityEntityReference {
	return {
		id,
		name: 'Test Community',
		domain: 'test.com',
		whiteLabelDomain: null,
		handle: null,
		createdBy: {} as EndUserEntityReference,
		loadCreatedBy: vi.fn(),
		createdAt: new Date(),
		updatedAt: new Date(),
		schemaVersion: '1.0.0',
	} as CommunityProps;
}

function makeMemberEntityReference(id = 'member-1'): MemberEntityReference {
	return {
		id,
		memberName: 'Test Member',
		cybersourceCustomerId: '12345',
		communityId: 'community-1',
		community: makeCommunityEntityReference(),
		loadCommunity: vi.fn(),
		accounts: [] as ReadonlyArray<MemberAccountEntityReference>,
		role: {} as EndUserRoleEntityReference,
		loadRole: vi.fn(),
		customViews: [] as ReadonlyArray<MemberCustomViewEntityReference>,
		profile: {} as MemberProfileProps,
		createdAt: new Date(),
		updatedAt: new Date(),
		schemaVersion: '1.0.0',
	} as MemberEntityReference;
}

function makePropertyLocationProps(): PropertyLocationProps {
	return {
		address: {
			streetNumber: '123',
			streetName: 'Main St',
			localName: 'Downtown',
			municipalitySubdivision: 'Test City',
			municipality: 'TS',
			postalCode: '12345',
			country: 'USA',
		} as unknown as PropertyLocationAddressProps,
		position: {
			type: 'Point',
			coordinates: [-122.4194, 37.7749],
		},
	};
}

function makePropertyListingDetailProps(): PropertyListingDetailProps {
	return {
		price: 100000,
		rentHigh: null,
		rentLow: null,
		lease: null,
		maxGuests: 4,
		bedrooms: 2,
		bedroomDetails: {} as PropArray<PropertyListingDetailBedroomDetailProps>,
		bathrooms: 2,
		squareFeet: 1200,
		yearBuilt: 2020,
		lotSize: null,
		description: 'A nice property',
		amenities: ['pool', 'gym'],
		additionalAmenities:
			{} as PropArray<PropertyListingDetailAdditionalAmenityProps>,
		images: ['image1.jpg'],
		video: null,
		floorPlan: null,
		floorPlanImages: [],
		listingAgent: 'John Doe',
		listingAgentPhone: '555-1234',
		listingAgentEmail: 'john@example.com',
		listingAgentWebsite: null,
		listingAgentCompany: 'Real Estate Co',
		listingAgentCompanyPhone: null,
		listingAgentCompanyEmail: null,
		listingAgentCompanyWebsite: null,
		listingAgentCompanyAddress: null,
	};
}

function makeBaseProps(overrides: Partial<PropertyProps> = {}): PropertyProps {
	return {
		id: 'property-1',
		community: makeCommunityEntityReference(),
		location: makePropertyLocationProps(),
		owner: makeMemberEntityReference(),
		propertyName: 'Test Property',
		propertyType: 'House',
		listedForSale: false,
		listedForRent: false,
		listedForLease: false,
		listedInDirectory: true,
		listingDetail: makePropertyListingDetailProps(),
		tags: [],
		hash: null,
		lastIndexed: null,
		updateIndexFailedDate: null,
		createdAt: new Date('2020-01-01T00:00:00Z'),
		updatedAt: new Date('2020-01-02T00:00:00Z'),
		schemaVersion: '1.0.0',
		...overrides,
	};
}

test.for(feature, ({ Scenario, Background, BeforeEachScenario }) => {
	let passport: Passport;
	let baseProps: PropertyProps;
	let communityRef: CommunityEntityReference;
	let property: Property<PropertyProps>;
	let newProperty: Property<PropertyProps>;

	BeforeEachScenario(() => {
		passport = makePassport();
		communityRef = makeCommunityEntityReference();
		baseProps = makeBaseProps();
		property = new Property(baseProps, passport);
		newProperty = undefined as unknown as Property<PropertyProps>;
	});

	Background(({ Given, And }) => {
		Given('a valid Passport with property permissions', () => {
			passport = makePassport({ canManageProperties: true });
		});
		And('a valid CommunityEntityReference', () => {
			communityRef = makeCommunityEntityReference();
		});
		And(
			'base property properties with propertyName "Test Property", propertyType "House", listedForSale true, listedForRent false, listedForLease false, listedInDirectory true, a valid community, owner, location, listingDetail, and valid timestamps',
			() => {
				baseProps = makeBaseProps();
				property = new Property(baseProps, passport);
			},
		);
	});

	Scenario('Creating a new property instance', ({ When, Then, And }) => {
		When(
			'I create a new Property aggregate using getNewInstance with propertyName "New Property", and a CommunityEntityReference',
			() => {
				newProperty = Property.getNewInstance(
					makeBaseProps(),
					'New Property',
					communityRef,
					passport,
				);
			},
		);
		Then('the property\'s propertyName should be "New Property"', () => {
			expect(newProperty.propertyName).toBe('New Property');
		});
		And(
			"the property's community should reference the provided CommunityEntityReference",
			() => {
				expect(newProperty.community.id).toBe(communityRef.id);
			},
		);
		And("the property's listedForSale should be false", () => {
			expect(newProperty.listedForSale).toBe(false);
		});
		And("the property's listedForRent should be false", () => {
			expect(newProperty.listedForRent).toBe(false);
		});
		And("the property's listedForLease should be false", () => {
			expect(newProperty.listedForLease).toBe(false);
		});
		And("the property's listedInDirectory should be false", () => {
			expect(newProperty.listedInDirectory).toBe(false);
		});
	});

	Scenario(
		'Changing the propertyName with permission to manage properties',
		({ Given, When, Then }) => {
			Given('a Property aggregate with permission to manage properties', () => {
				passport = makePassport({ canManageProperties: true });
				property = new Property(makeBaseProps(), passport);
			});
			When('I set the propertyName to "Updated Property"', () => {
				property.propertyName = 'Updated Property';
			});
			Then('the property\'s propertyName should be "Updated Property"', () => {
				expect(property.propertyName).toBe('Updated Property');
			});
		},
	);

	Scenario(
		'Changing the propertyName without permission',
		({ Given, When, Then }) => {
			let changePropertyNameWithoutPermission: () => void;
			Given(
				'a Property aggregate without permission to manage properties',
				() => {
					passport = makePassport({ canManageProperties: false });
					property = new Property(makeBaseProps(), passport);
				},
			);
			When('I try to set the propertyName to "Updated Property"', () => {
				changePropertyNameWithoutPermission = () => {
					property.propertyName = 'Updated Property';
				};
			});
			Then('a PermissionError should be thrown', () => {
				expect(changePropertyNameWithoutPermission).toThrow(PermissionError);
				expect(changePropertyNameWithoutPermission).toThrow(
					"You do not have permission to update this property's name",
				);
			});
		},
	);

	Scenario(
		'Changing the propertyName to an invalid value',
		({ Given, When, Then }) => {
			let changePropertyNameToNull: () => void;
			let changePropertyNameToEmpty: () => void;
			Given('a Property aggregate with permission to manage properties', () => {
				passport = makePassport({ canManageProperties: true });
				property = new Property(makeBaseProps(), passport);
			});
			When(
				'I try to set the propertyName to an invalid value (e.g., null or empty string)',
				() => {
					changePropertyNameToNull = () => {
						// @ts-expect-error
						property.propertyName = null;
					};
					changePropertyNameToEmpty = () => {
						property.propertyName = '';
					};
				},
			);
			Then('an error should be thrown indicating the value is invalid', () => {
				expect(changePropertyNameToNull).toThrow('Wrong raw value type');
				expect(changePropertyNameToEmpty).toThrow('Too short');
			});
		},
	);

	Scenario(
		'Changing the propertyType with permission to manage properties',
		({ Given, When, Then }) => {
			Given('a Property aggregate with permission to manage properties', () => {
				passport = makePassport({ canManageProperties: true });
				property = new Property(makeBaseProps(), passport);
			});
			When('I set the propertyType to "Apartment"', () => {
				property.propertyType = 'Apartment';
			});
			Then('the property\'s propertyType should be "Apartment"', () => {
				expect(property.propertyType).toBe('Apartment');
			});
		},
	);

	Scenario(
		'Changing the propertyType without permission',
		({ Given, When, Then }) => {
			let changePropertyTypeWithoutPermission: () => void;
			Given(
				'a Property aggregate without permission to manage properties',
				() => {
					passport = makePassport({ canManageProperties: false });
					property = new Property(makeBaseProps(), passport);
				},
			);
			When('I try to set the propertyType to "Apartment"', () => {
				changePropertyTypeWithoutPermission = () => {
					property.propertyType = 'Apartment';
				};
			});
			Then('a PermissionError should be thrown', () => {
				expect(changePropertyTypeWithoutPermission).toThrow(PermissionError);
				expect(changePropertyTypeWithoutPermission).toThrow(
					"You do not have permission to update this property's type",
				);
			});
		},
	);

	Scenario(
		'Changing the propertyType to an invalid value',
		({ Given, When, Then }) => {
			let changePropertyTypeToNull: () => void;
			let changePropertyTypeToEmpty: () => void;
			Given('a Property aggregate with permission to manage properties', () => {
				passport = makePassport({ canManageProperties: true });
				property = new Property(makeBaseProps(), passport);
			});
			When(
				'I try to set the propertyType to an invalid value (e.g., null or empty string)',
				() => {
					changePropertyTypeToNull = () => {
						// @ts-expect-error
						property.propertyType = null;
					};
					changePropertyTypeToEmpty = () => {
						property.propertyType = '';
					};
				},
			);
			Then('an error should be thrown indicating the value is invalid', () => {
				expect(changePropertyTypeToNull).toThrow('Wrong raw value type');
				expect(changePropertyTypeToEmpty).toThrow('Too short');
			});
		},
	);

	Scenario(
		'Changing listedForSale with permission to manage properties',
		({ Given, When, Then }) => {
			Given('a Property aggregate with permission to manage properties', () => {
				passport = makePassport({ canManageProperties: true });
				property = new Property(makeBaseProps(), passport);
			});
			When('I set listedForSale to false', () => {
				property.listedForSale = false;
			});
			Then("the property's listedForSale should be false", () => {
				expect(property.listedForSale).toBe(false);
			});
		},
	);

	Scenario(
		'Changing listedForSale without permission',
		({ Given, When, Then }) => {
			let changeListedForSaleWithoutPermission: () => void;
			Given(
				'a Property aggregate without permission to manage properties',
				() => {
					passport = makePassport({ canManageProperties: false });
					property = new Property(makeBaseProps(), passport);
				},
			);
			When('I try to set listedForSale to false', () => {
				changeListedForSaleWithoutPermission = () => {
					property.listedForSale = false;
				};
			});
			Then('a PermissionError should be thrown', () => {
				expect(changeListedForSaleWithoutPermission).toThrow(PermissionError);
				expect(changeListedForSaleWithoutPermission).toThrow(
					'You do not have permission to update the sale status of this property',
				);
			});
		},
	);

	Scenario(
		'Changing listedForRent with permission to manage properties',
		({ Given, When, Then }) => {
			Given('a Property aggregate with permission to manage properties', () => {
				passport = makePassport({ canManageProperties: true });
				property = new Property(makeBaseProps(), passport);
			});
			When('I set listedForRent to true', () => {
				property.listedForRent = true;
			});
			Then("the property's listedForRent should be true", () => {
				expect(property.listedForRent).toBe(true);
			});
		},
	);

	Scenario(
		'Changing listedForRent without permission',
		({ Given, When, Then }) => {
			let changeListedForRentWithoutPermission: () => void;
			Given(
				'a Property aggregate without permission to manage properties',
				() => {
					passport = makePassport({ canManageProperties: false });
					property = new Property(makeBaseProps(), passport);
				},
			);
			When('I try to set listedForRent to true', () => {
				changeListedForRentWithoutPermission = () => {
					property.listedForRent = true;
				};
			});
			Then('a PermissionError should be thrown', () => {
				expect(changeListedForRentWithoutPermission).toThrow(PermissionError);
				expect(changeListedForRentWithoutPermission).toThrow(
					'You do not have permission to update the rental status of this property',
				);
			});
		},
	);

	Scenario(
		'Changing listedForLease with permission to manage properties',
		({ Given, When, Then }) => {
			Given('a Property aggregate with permission to manage properties', () => {
				passport = makePassport({ canManageProperties: true });
				property = new Property(makeBaseProps(), passport);
			});
			When('I set listedForLease to true', () => {
				property.listedForLease = true;
			});
			Then("the property's listedForLease should be true", () => {
				expect(property.listedForLease).toBe(true);
			});
		},
	);

	Scenario(
		'Changing listedForLease without permission',
		({ Given, When, Then }) => {
			let changeListedForLeaseWithoutPermission: () => void;
			Given(
				'a Property aggregate without permission to manage properties',
				() => {
					passport = makePassport({ canManageProperties: false });
					property = new Property(makeBaseProps(), passport);
				},
			);
			When('I try to set listedForLease to true', () => {
				changeListedForLeaseWithoutPermission = () => {
					property.listedForLease = true;
				};
			});
			Then('a PermissionError should be thrown', () => {
				expect(changeListedForLeaseWithoutPermission).toThrow(PermissionError);
				expect(changeListedForLeaseWithoutPermission).toThrow(
					'You do not have permission to update the lease status of this property',
				);
			});
		},
	);

	Scenario(
		'Changing listedInDirectory with permission to manage properties',
		({ Given, When, Then }) => {
			Given('a Property aggregate with permission to manage properties', () => {
				passport = makePassport({ canManageProperties: true });
				property = new Property(makeBaseProps(), passport);
			});
			When('I set listedInDirectory to false', () => {
				property.listedInDirectory = false;
			});
			Then("the property's listedInDirectory should be false", () => {
				expect(property.listedInDirectory).toBe(false);
			});
		},
	);

	Scenario(
		'Changing listedInDirectory without permission',
		({ Given, When, Then }) => {
			let changeListedInDirectoryWithoutPermission: () => void;
			Given(
				'a Property aggregate without permission to manage properties',
				() => {
					passport = makePassport({ canManageProperties: false });
					property = new Property(makeBaseProps(), passport);
				},
			);
			When('I try to set listedInDirectory to false', () => {
				changeListedInDirectoryWithoutPermission = () => {
					property.listedInDirectory = false;
				};
			});
			Then('a PermissionError should be thrown', () => {
				expect(changeListedInDirectoryWithoutPermission).toThrow(
					PermissionError,
				);
				expect(changeListedInDirectoryWithoutPermission).toThrow(
					'You do not have permission to update the directory visibility for this property',
				);
			});
		},
	);

	Scenario(
		'Getting createdAt, updatedAt, and schemaVersion',
		({ Given, Then, And }) => {
			Given('a Property aggregate', () => {
				passport = makePassport({ canManageProperties: true });
				baseProps = makeBaseProps();
				property = new Property(baseProps, passport);
			});
			Then('the createdAt property should return the correct date', () => {
				expect(property.createdAt).toEqual(new Date('2020-01-01T00:00:00Z'));
			});
			And('the updatedAt property should return the correct date', () => {
				expect(property.updatedAt).toEqual(new Date('2020-01-02T00:00:00Z'));
			});
			And(
				'the schemaVersion property should return the correct version',
				() => {
					expect(property.schemaVersion).toBe('1.0.0');
				},
			);
		},
	);

	Scenario(
		'Requesting property deletion with permission',
		({ Given, When, Then, And }) => {
			Given('a Property aggregate with permission to manage properties', () => {
				passport = makePassport({ canManageProperties: true });
				property = new Property(makeBaseProps(), passport);
			});
			When('I request to delete the property', () => {
				property.requestDelete();
			});
			Then('the property should be marked as deleted', () => {
				expect(property.isDeleted).toBe(true);
			});
			And(
				'a PropertyDeletedEvent should be added to integration events',
				() => {
					const events = property.getIntegrationEvents();
					expect(events).toHaveLength(1);
					expect(events[0]?.constructor.name).toBe('PropertyDeletedEvent');
				},
			);
		},
	);

	Scenario(
		'Requesting property deletion without permission',
		({ Given, When, Then }) => {
			let requestDeleteWithoutPermission: () => void;
			Given(
				'a Property aggregate without permission to manage properties',
				() => {
					passport = makePassport({ canManageProperties: false });
					property = new Property(makeBaseProps(), passport);
				},
			);
			When('I try to request deletion of the property', () => {
				requestDeleteWithoutPermission = () => {
					property.requestDelete();
				};
			});
			Then('a PermissionError should be thrown', () => {
				expect(requestDeleteWithoutPermission).toThrow(PermissionError);
				expect(requestDeleteWithoutPermission).toThrow(
					'You do not have permission to delete this property',
				);
			});
		},
	);

	Scenario(
		'Changing the location with permission to manage properties',
		({ Given, When, Then }) => {
			Given('a Property aggregate with permission to manage properties', () => {
				passport = makePassport({ canManageProperties: true });
				property = new Property(makeBaseProps(), passport);
			});
			When('I set the location to a new valid location', () => {
				const newLocation = makePropertyLocationProps();
				newLocation.address.streetNumber = '456';
				property.location = newLocation;
			});
			Then("the property's location should be updated", () => {
				expect(property.location.address.streetNumber).toBe('456');
			});
		},
	);

	Scenario(
		'Changing the location without permission',
		({ Given, When, Then }) => {
			let changeLocationWithoutPermission: () => void;
			Given(
				'a Property aggregate without permission to manage properties',
				() => {
					passport = makePassport({
						canManageProperties: false,
						canEditOwnProperty: false,
						isEditingOwnProperty: false,
					});
					property = new Property(makeBaseProps(), passport);
				},
			);
			When('I try to set the location to a new valid location', () => {
				changeLocationWithoutPermission = () => {
					const newLocation = makePropertyLocationProps();
					newLocation.address.streetNumber = '456';
					property.location = newLocation;
				};
			});
			Then('a PermissionError should be thrown', () => {
				expect(changeLocationWithoutPermission).toThrow(PermissionError);
				expect(changeLocationWithoutPermission).toThrow(
					"You do not have permission to update this property's location",
				);
			});
		},
	);

	Scenario(
		'Changing the location with edit own property permission',
		({ Given, When, Then }) => {
			Given(
				'a Property aggregate with edit own property permission and is editing own property',
				() => {
					passport = makePassport({
						canManageProperties: false,
						canEditOwnProperty: true,
						isEditingOwnProperty: true,
					});
					property = new Property(makeBaseProps(), passport);
				},
			);
			When('I set the location to a new valid location', () => {
				const newLocation = makePropertyLocationProps();
				newLocation.address.streetNumber = '789';
				property.location = newLocation;
			});
			Then("the property's location should be updated", () => {
				expect(property.location.address.streetNumber).toBe('789');
			});
		},
	);

	Scenario(
		'Changing the owner with permission to manage properties',
		({ Given, When, Then }) => {
			Given('a Property aggregate with permission to manage properties', () => {
				passport = makePassport({ canManageProperties: true });
				property = new Property(makeBaseProps(), passport);
			});
			When('I set the owner to a new member', () => {
				const newOwner = makeMemberEntityReference('new-owner-1');
				property.owner = newOwner;
			});
			Then("the property's owner should be updated", () => {
				expect(property.owner?.id).toBe('new-owner-1');
			});
		},
	);

	Scenario('Changing the owner without permission', ({ Given, When, Then }) => {
		let changeOwnerWithoutPermission: () => void;
		Given(
			'a Property aggregate without permission to manage properties',
			() => {
				passport = makePassport({ canManageProperties: false });
				property = new Property(makeBaseProps(), passport);
			},
		);
		When('I try to set the owner to a new member', () => {
			changeOwnerWithoutPermission = () => {
				const newOwner = makeMemberEntityReference('new-owner-1');
				property.owner = newOwner;
			};
		});
		Then('a PermissionError should be thrown', () => {
			expect(changeOwnerWithoutPermission).toThrow(PermissionError);
			expect(changeOwnerWithoutPermission).toThrow(
				"You do not have permission to update this property's owner",
			);
		});
	});

	Scenario(
		'Changing the tags with permission to manage properties',
		({ Given, When, Then }) => {
			Given('a Property aggregate with permission to manage properties', () => {
				passport = makePassport({ canManageProperties: true });
				property = new Property(makeBaseProps(), passport);
			});
			When('I set the tags to ["pool", "gym", "parking"]', () => {
				property.tags = ['pool', 'gym', 'parking'];
			});
			Then('the property\'s tags should be ["pool", "gym", "parking"]', () => {
				expect(property.tags).toEqual(['pool', 'gym', 'parking']);
			});
		},
	);

	Scenario('Changing the tags without permission', ({ Given, When, Then }) => {
		let changeTagsWithoutPermission: () => void;
		Given(
			'a Property aggregate without permission to manage properties',
			() => {
				passport = makePassport({
					canManageProperties: false,
					canEditOwnProperty: false,
					isEditingOwnProperty: false,
				});
				property = new Property(makeBaseProps(), passport);
			},
		);
		When('I try to set the tags to ["pool", "gym"]', () => {
			changeTagsWithoutPermission = () => {
				property.tags = ['pool', 'gym'];
			};
		});
		Then('a PermissionError should be thrown', () => {
			expect(changeTagsWithoutPermission).toThrow(PermissionError);
			expect(changeTagsWithoutPermission).toThrow(
				'You do not have permission to update the tags for this property',
			);
		});
	});

	Scenario(
		'Changing the tags with edit own property permission',
		({ Given, When, Then }) => {
			Given(
				'a Property aggregate with edit own property permission and is editing own property',
				() => {
					passport = makePassport({
						canManageProperties: false,
						canEditOwnProperty: true,
						isEditingOwnProperty: true,
					});
					property = new Property(makeBaseProps(), passport);
				},
			);
			When('I set the tags to ["pool", "gym"]', () => {
				property.tags = ['pool', 'gym'];
			});
			Then('the property\'s tags should be ["pool", "gym"]', () => {
				expect(property.tags).toEqual(['pool', 'gym']);
			});
		},
	);

	Scenario(
		'Setting the hash with permission to manage properties',
		({ Given, When, Then }) => {
			Given('a Property aggregate with permission to manage properties', () => {
				passport = makePassport({ canManageProperties: true });
				property = new Property(makeBaseProps(), passport);
			});
			When('I set the hash to "new-hash-value"', () => {
				property.hash = 'new-hash-value';
			});
			Then('the property\'s hash should be "new-hash-value"', () => {
				expect(property.hash).toBe('new-hash-value');
			});
		},
	);

	Scenario('Setting the hash without permission', ({ Given, When, Then }) => {
		let setHashWithoutPermission: () => void;
		Given(
			'a Property aggregate without permission to manage properties',
			() => {
				passport = makePassport({
					canManageProperties: false,
					canEditOwnProperty: false,
					isEditingOwnProperty: false,
				});
				property = new Property(makeBaseProps(), passport);
			},
		);
		When('I try to set the hash to "new-hash-value"', () => {
			setHashWithoutPermission = () => {
				property.hash = 'new-hash-value';
			};
		});
		Then('a PermissionError should be thrown', () => {
			expect(setHashWithoutPermission).toThrow(PermissionError);
			expect(setHashWithoutPermission).toThrow(
				'You do not have permission to update the index hash for this property',
			);
		});
	});

	Scenario(
		'Setting the hash with edit own property permission',
		({ Given, When, Then }) => {
			Given(
				'a Property aggregate with edit own property permission and is editing own property',
				() => {
					passport = makePassport({
						canManageProperties: false,
						canEditOwnProperty: true,
						isEditingOwnProperty: true,
					});
					property = new Property(makeBaseProps(), passport);
				},
			);
			When('I set the hash to "new-hash-value"', () => {
				property.hash = 'new-hash-value';
			});
			Then('the property\'s hash should be "new-hash-value"', () => {
				expect(property.hash).toBe('new-hash-value');
			});
		},
	);

	Scenario(
		'Setting lastIndexed with permission to manage properties',
		({ Given, When, Then }) => {
			Given('a Property aggregate with permission to manage properties', () => {
				passport = makePassport({ canManageProperties: true });
				property = new Property(makeBaseProps(), passport);
			});
			When('I set lastIndexed to a specific date', () => {
				const testDate = new Date('2024-01-01T00:00:00Z');
				property.lastIndexed = testDate;
			});
			Then("the property's lastIndexed should be updated", () => {
				expect(property.lastIndexed).toEqual(new Date('2024-01-01T00:00:00Z'));
			});
		},
	);

	Scenario(
		'Setting lastIndexed without permission',
		({ Given, When, Then }) => {
			let setLastIndexedWithoutPermission: () => void;
			Given(
				'a Property aggregate without permission to manage properties',
				() => {
					passport = makePassport({
						canManageProperties: false,
						canEditOwnProperty: false,
						isEditingOwnProperty: false,
					});
					property = new Property(makeBaseProps(), passport);
				},
			);
			When('I try to set lastIndexed to a specific date', () => {
				setLastIndexedWithoutPermission = () => {
					const testDate = new Date('2024-01-01T00:00:00Z');
					property.lastIndexed = testDate;
				};
			});
			Then('a PermissionError should be thrown', () => {
				expect(setLastIndexedWithoutPermission).toThrow(PermissionError);
				expect(setLastIndexedWithoutPermission).toThrow(
					'You do not have permission to update the index timestamp for this property',
				);
			});
		},
	);

	Scenario(
		'Setting lastIndexed with edit own property permission',
		({ Given, When, Then }) => {
			Given(
				'a Property aggregate with edit own property permission and is editing own property',
				() => {
					passport = makePassport({
						canManageProperties: false,
						canEditOwnProperty: true,
						isEditingOwnProperty: true,
					});
					property = new Property(makeBaseProps(), passport);
				},
			);
			When('I set lastIndexed to a specific date', () => {
				const testDate = new Date('2024-01-01T00:00:00Z');
				property.lastIndexed = testDate;
			});
			Then("the property's lastIndexed should be updated", () => {
				expect(property.lastIndexed).toEqual(new Date('2024-01-01T00:00:00Z'));
			});
		},
	);

	Scenario(
		'Setting updateIndexFailedDate with permission to manage properties',
		({ Given, When, Then }) => {
			Given('a Property aggregate with permission to manage properties', () => {
				passport = makePassport({ canManageProperties: true });
				property = new Property(makeBaseProps(), passport);
			});
			When('I set updateIndexFailedDate to a specific date', () => {
				const testDate = new Date('2024-01-01T00:00:00Z');
				property.updateIndexFailedDate = testDate;
			});
			Then("the property's updateIndexFailedDate should be updated", () => {
				expect(property.updateIndexFailedDate).toEqual(
					new Date('2024-01-01T00:00:00Z'),
				);
			});
		},
	);

	Scenario(
		'Setting updateIndexFailedDate without permission',
		({ Given, When, Then }) => {
			let setUpdateIndexFailedDateWithoutPermission: () => void;
			Given(
				'a Property aggregate without permission to manage properties',
				() => {
					passport = makePassport({
						canManageProperties: false,
						canEditOwnProperty: false,
						isEditingOwnProperty: false,
					});
					property = new Property(makeBaseProps(), passport);
				},
			);
			When('I try to set updateIndexFailedDate to a specific date', () => {
				setUpdateIndexFailedDateWithoutPermission = () => {
					const testDate = new Date('2024-01-01T00:00:00Z');
					property.updateIndexFailedDate = testDate;
				};
			});
			Then('a PermissionError should be thrown', () => {
				expect(setUpdateIndexFailedDateWithoutPermission).toThrow(
					PermissionError,
				);
				expect(setUpdateIndexFailedDateWithoutPermission).toThrow(
					'You do not have permission to update the failed index timestamp for this property',
				);
			});
		},
	);

	Scenario(
		'Setting updateIndexFailedDate with edit own property permission',
		({ Given, When, Then }) => {
			Given(
				'a Property aggregate with edit own property permission and is editing own property',
				() => {
					passport = makePassport({
						canManageProperties: false,
						canEditOwnProperty: true,
						isEditingOwnProperty: true,
					});
					property = new Property(makeBaseProps(), passport);
				},
			);
			When('I set updateIndexFailedDate to a specific date', () => {
				const testDate = new Date('2024-01-01T00:00:00Z');
				property.updateIndexFailedDate = testDate;
			});
			Then("the property's updateIndexFailedDate should be updated", () => {
				expect(property.updateIndexFailedDate).toEqual(
					new Date('2024-01-01T00:00:00Z'),
				);
			});
		},
	);

	Scenario('Getting listingDetail', ({ Given, Then }) => {
		Given('a Property aggregate', () => {
			property = new Property(makeBaseProps(), passport);
		});
		Then('I should be able to get the listingDetail', () => {
			expect(property.listingDetail).toBeDefined();
			expect(typeof property.listingDetail.price).toBe('number');
		});
	});
});
