import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { expect, vi } from 'vitest';
import type { EndUserContactInformationProps } from './end-user-contact-information.ts';
import type { EndUserIdentityDetailsProps } from './end-user-identity-details.ts';
import { EndUserPersonalInformation } from './end-user-personal-information.ts';

const test = { for: describeFeature };
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feature = await loadFeature(
	path.resolve(__dirname, 'features/end-user-personal-information.feature'),
);

function makeVisa() {
	return vi.mocked({
		determineIf: vi.fn(() => true),
	});
}

function makeIdentityDetailsProps(overrides = {}) {
	return {
		lastName: 'Smith',
		legalNameConsistsOfOneName: false,
		restOfName: 'Alice',
		...overrides,
	};
}

function makeContactInformationProps(overrides = {}) {
	return {
		email: 'alice@cellix.com',
		...overrides,
	};
}

function makePersonalInformationProps(overrides = {}) {
	return {
		identityDetails: makeIdentityDetailsProps(),
		contactInformation: makeContactInformationProps(),
		...overrides,
	};
}

function makeRoot() {
	return {
		get isNew(): boolean {
			return false;
		},
		addDomainEvent: vi.fn(),
		addIntegrationEvent: vi.fn(),
	};
}

test.for(feature, ({ Scenario, Background, BeforeEachScenario }) => {
	let visa: ReturnType<typeof makeVisa>;
	let root: ReturnType<typeof makeRoot>;
	let identityDetailsProps: ReturnType<typeof makeIdentityDetailsProps>;
	let contactInformationProps: ReturnType<typeof makeContactInformationProps>;
	let personalInformationProps: ReturnType<typeof makePersonalInformationProps>;
	let entity: EndUserPersonalInformation;

	BeforeEachScenario(() => {
		visa = makeVisa();
		root = makeRoot();
		identityDetailsProps = makeIdentityDetailsProps();
		contactInformationProps = makeContactInformationProps();
		personalInformationProps = makePersonalInformationProps();
		entity = new EndUserPersonalInformation(
			personalInformationProps,
			visa,
			root,
		);
	});

	Background(({ Given, And }) => {
		Given(
			'valid EndUserIdentityDetailsProps and EndUserContactInformationProps',
			() => {
				identityDetailsProps = makeIdentityDetailsProps();
				contactInformationProps = makeContactInformationProps();
				personalInformationProps = makePersonalInformationProps();
			},
		);
		And('a valid UserVisa', () => {
			visa = makeVisa();
		});
	});

	Scenario(
		'Creating a new EndUserPersonalInformation instance',
		({ When, Then, And }) => {
			let newEntity: EndUserPersonalInformation;
			When(
				'I create a new EndUserPersonalInformation using getNewInstance with the identity details and contact information',
				() => {
					newEntity = new EndUserPersonalInformation(
						personalInformationProps,
						visa,
						root,
					);
				},
			);
			Then(
				"the entity's identity details should be set to the provided identity details",
				() => {
					expect(newEntity.identityDetails).toBeDefined();
					expect(newEntity.identityDetails.lastName).toBe(
						identityDetailsProps.lastName,
					);
					expect(newEntity.identityDetails.legalNameConsistsOfOneName).toBe(
						identityDetailsProps.legalNameConsistsOfOneName,
					);
					expect(newEntity.identityDetails.restOfName).toBe(
						identityDetailsProps.restOfName,
					);
				},
			);
			And(
				"the entity's contact information should be set to the provided contact information",
				() => {
					expect(newEntity.contactInformation).toBeDefined();
					expect(newEntity.contactInformation.email).toBe(
						contactInformationProps.email,
					);
				},
			);
		},
	);

	Scenario(
		'Getting identity details and contact information',
		({ Given, When, Then }) => {
			let identityDetails: EndUserIdentityDetailsProps;
			let contactInformation: EndUserContactInformationProps;
			Given('an EndUserPersonalInformation instance', () => {
				entity = new EndUserPersonalInformation(
					personalInformationProps,
					visa,
					root,
				);
			});
			When('I access identity details and contact information', () => {
				identityDetails = entity.identityDetails;
				contactInformation = entity.contactInformation;
			});
			Then(
				'I should receive EndUserIdentityDetails and EndUserContactInformation entity instances',
				() => {
					expect(identityDetails).toBeDefined();
					expect(identityDetails.lastName).toBe(
						personalInformationProps.identityDetails.lastName,
					);
					expect(identityDetails.legalNameConsistsOfOneName).toBe(
						personalInformationProps.identityDetails.legalNameConsistsOfOneName,
					);
					expect(identityDetails.restOfName).toBe(
						personalInformationProps.identityDetails.restOfName,
					);
					expect(contactInformation).toBeDefined();
					expect(contactInformation.email).toBe(
						personalInformationProps.contactInformation.email,
					);
				},
			);
		},
	);
});
