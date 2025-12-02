import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { expect, vi } from 'vitest';
import type { ServiceTicketV1EntityReference } from '../../../contexts/case/service-ticket/v1/index.ts';
import type { ViolationTicketV1EntityReference } from '../../../contexts/case/violation-ticket/v1/index.ts';
import { GuestCasePassport } from './guest.case.passport.ts';

const test = { for: describeFeature };
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feature = await loadFeature(
	path.resolve(__dirname, 'features/guest.case.passport.feature'),
);

function makeServiceTicketV1EntityReference(): ServiceTicketV1EntityReference {
	return vi.mocked({
		id: 'service-ticket-id',
	// biome-ignore lint/plugin/no-type-assertion: test file
	} as ServiceTicketV1EntityReference);
}

function makeViolationTicketV1EntityReference(): ViolationTicketV1EntityReference {
	return vi.mocked({
		id: 'violation-ticket-id',
	// biome-ignore lint/plugin/no-type-assertion: test file
	} as ViolationTicketV1EntityReference);
}

test.for(feature, ({ Scenario }) => {
	let passport: GuestCasePassport;
	let serviceTicketRef: ServiceTicketV1EntityReference;
	let violationTicketRef: ViolationTicketV1EntityReference;
	let serviceTicketVisa: { determineIf: (fn: () => boolean) => boolean };
	let violationTicketVisa: { determineIf: (fn: () => boolean) => boolean };

	Scenario(
		'Creating GuestCasePassport and getting visa for service ticket V1',
		({ When, Then, And }) => {
			When('I create a GuestCasePassport', () => {
				passport = new GuestCasePassport();
			});

			And('I have a service ticket V1 entity reference', () => {
				serviceTicketRef = makeServiceTicketV1EntityReference();
			});

			And('I call forServiceTicketV1 with the service ticket reference', () => {
				serviceTicketVisa = passport.forServiceTicketV1(serviceTicketRef);
			});

			Then('it should return a visa that denies all permissions', () => {
				expect(serviceTicketVisa).toBeDefined();
				expect(typeof serviceTicketVisa.determineIf).toBe('function');
				expect(serviceTicketVisa.determineIf(() => true)).toBe(false);
				expect(serviceTicketVisa.determineIf(() => false)).toBe(false);
			});
		},
	);

	Scenario(
		'Creating GuestCasePassport and getting visa for violation ticket V1',
		({ When, Then, And }) => {
			When('I create a GuestCasePassport', () => {
				passport = new GuestCasePassport();
			});

			And('I have a violation ticket V1 entity reference', () => {
				violationTicketRef = makeViolationTicketV1EntityReference();
			});

			And(
				'I call forViolationTicketV1 with the violation ticket reference',
				() => {
					violationTicketVisa =
						passport.forViolationTicketV1(violationTicketRef);
				},
			);

			Then('it should return a visa that denies all permissions', () => {
				expect(violationTicketVisa).toBeDefined();
				expect(typeof violationTicketVisa.determineIf).toBe('function');
				expect(violationTicketVisa.determineIf(() => true)).toBe(false);
				expect(violationTicketVisa.determineIf(() => false)).toBe(false);
			});
		},
	);
});
