import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';
import type { ServiceTicketV1EntityReference } from '../../../contexts/case/service-ticket/v1/service-ticket-v1.aggregate.ts';
import type { ViolationTicketV1EntityReference } from '../../../contexts/case/violation-ticket/v1/violation-ticket-v1.aggregate.ts';
import type { CommunityEntityReference } from '../../../contexts/community/community/community.ts';
import type { PropertyEntityReference } from '../../../contexts/property/property/property.aggregate.ts';
import type { StaffUserEntityReference } from '../../../contexts/user/staff-user/staff-user.ts';
import { StaffUserCasePassport } from './contexts/staff-user.case.passport.ts';
import { StaffUserCommunityPassport } from './contexts/staff-user.community.passport.ts';
import { StaffUserCommunityVisa } from './contexts/staff-user.community.visa.ts';
import { StaffUserPropertyPassport } from './contexts/staff-user.property.passport.ts';
import { StaffUserServiceTicketVisa } from './contexts/staff-user.service-ticket.visa.ts';
import { StaffUserUserPassport } from './contexts/staff-user.user.passport.ts';
import { StaffUserViolationTicketVisa } from './contexts/staff-user.violation-ticket.visa.ts';
import { StaffUserPassport } from './staff-user.passport.ts';

const test = { for: describeFeature };
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feature = await loadFeature(path.resolve(__dirname, 'features/staff-user.passport.feature'));

function makeStaffUser(id = 'staff-1') {
	return {
		id,
		role: {
			permissions: {
				communityPermissions: {
					canManageAllCommunities: true,
					canManageCommunitySettings: true,
				},
			},
		},
	} as unknown as StaffUserEntityReference;
}

test.for(feature, ({ Scenario, Background, BeforeEachScenario }) => {
	let staffUser: ReturnType<typeof makeStaffUser>;
	let passport: StaffUserPassport;
	let communityPassport: unknown;

	BeforeEachScenario(() => {
		staffUser = makeStaffUser();
		passport = undefined as unknown as StaffUserPassport;
		communityPassport = undefined;
	});

	Background(({ Given }) => {
		Given('a valid StaffUserEntityReference', () => {
			staffUser = makeStaffUser('staff-1');
		});
	});

	Scenario('Creating a StaffUserPassport with valid staff user', ({ When, Then }) => {
		When('I create a StaffUserPassport with the staff user', () => {
			passport = new StaffUserPassport(staffUser);
		});
		Then('the passport should be created successfully', () => {
			expect(passport).toBeInstanceOf(StaffUserPassport);
		});
	});

	Scenario('Accessing the community passport', ({ When, And, Then }) => {
		When('I create a StaffUserPassport with valid staff user', () => {
			passport = new StaffUserPassport(staffUser);
		});
		And('I access the community property', () => {
			communityPassport = passport.community;
		});
		Then('I should receive a StaffUserCommunityPassport instance with all visas', () => {
			expect(communityPassport).toBeInstanceOf(StaffUserCommunityPassport);
			expect(
				(communityPassport as StaffUserCommunityPassport).forCommunity({
					id: 'community-1',
				} as CommunityEntityReference),
			).toBeInstanceOf(StaffUserCommunityVisa);
		});
	});

	Scenario('Accessing the service passport', ({ When, And, Then }) => {
		let getServicePassport: () => void;
		When('I create a StaffUserPassport with valid staff user', () => {
			passport = new StaffUserPassport(staffUser);
		});
		And('I access the service property', () => {
			getServicePassport = () => passport.service;
		});
		Then('an error should be thrown indicating the service passport is not available', () => {
			expect(getServicePassport).toThrow('Service passport is not available for StaffUserPassport');
		});
	});

	Scenario('Accessing the user passport', ({ When, And, Then }) => {
		let userPassport: unknown;
		When('I create a StaffUserPassport with valid staff user', () => {
			passport = new StaffUserPassport(staffUser);
		});
		And('I access the user property', () => {
			userPassport = passport.user;
		});
		Then('I should receive a StaffUserUserPassport instance', () => {
			expect(userPassport).toBeInstanceOf(StaffUserUserPassport);
		});
	});

	// ─── case passport ───────────────────────────────────────────────────────────

	Scenario('Accessing the case passport', ({ When, And, Then }) => {
		let casePassport: unknown;
		When('I create a StaffUserPassport with valid staff user', () => {
			passport = new StaffUserPassport(staffUser);
		});
		And('I access the case property', () => {
			casePassport = passport.case;
		});
		Then('I should receive a StaffUserCasePassport instance', () => {
			expect(casePassport).toBeInstanceOf(StaffUserCasePassport);
		});
	});

	Scenario('The case passport forServiceTicketV1 returns a StaffUserServiceTicketVisa', ({ When, And, Then }) => {
		let casePassport: StaffUserCasePassport;
		When('I create a StaffUserPassport with valid staff user', () => {
			passport = new StaffUserPassport(staffUser);
		});
		And('I access the case property', () => {
			casePassport = passport.case as StaffUserCasePassport;
		});
		Then('forServiceTicketV1 should return a StaffUserServiceTicketVisa', () => {
			const visa = casePassport.forServiceTicketV1({} as ServiceTicketV1EntityReference);
			expect(visa).toBeInstanceOf(StaffUserServiceTicketVisa);
		});
	});

	Scenario('The case passport forViolationTicketV1 returns a StaffUserViolationTicketVisa', ({ When, And, Then }) => {
		let casePassport: StaffUserCasePassport;
		When('I create a StaffUserPassport with valid staff user', () => {
			passport = new StaffUserPassport(staffUser);
		});
		And('I access the case property', () => {
			casePassport = passport.case as StaffUserCasePassport;
		});
		Then('forViolationTicketV1 should return a StaffUserViolationTicketVisa', () => {
			const visa = casePassport.forViolationTicketV1({} as ViolationTicketV1EntityReference);
			expect(visa).toBeInstanceOf(StaffUserViolationTicketVisa);
		});
	});

	// ─── property passport ───────────────────────────────────────────────────────

	Scenario('Accessing the property passport', ({ When, And, Then }) => {
		let propertyPassport: unknown;
		When('I create a StaffUserPassport with valid staff user', () => {
			passport = new StaffUserPassport(staffUser);
		});
		And('I access the property property', () => {
			propertyPassport = passport.property;
		});
		Then('I should receive a StaffUserPropertyPassport instance', () => {
			expect(propertyPassport).toBeInstanceOf(StaffUserPropertyPassport);
		});
	});

	Scenario('The property passport forProperty returns a visa that always denies', ({ When, And, Then }) => {
		let propertyPassport: StaffUserPropertyPassport;
		When('I create a StaffUserPassport with valid staff user', () => {
			passport = new StaffUserPassport(staffUser);
		});
		And('I access the property property', () => {
			propertyPassport = passport.property as StaffUserPropertyPassport;
		});
		Then('forProperty should return a visa whose determineIf always returns false', () => {
			const visa = propertyPassport.forProperty({} as PropertyEntityReference);
			expect(visa.determineIf(() => true)).toBe(false);
		});
	});

	// ─── lazy-init caching ───────────────────────────────────────────────────────

	Scenario('Community passport is cached after first access', ({ When, And, Then }) => {
		let first: unknown;
		let second: unknown;
		When('I create a StaffUserPassport with valid staff user', () => {
			passport = new StaffUserPassport(staffUser);
		});
		And('I access the community property twice', () => {
			first = passport.community;
			second = passport.community;
		});
		Then('both accesses should return the same instance', () => {
			expect(first).toBe(second);
		});
	});

	Scenario('Case passport is cached after first access', ({ When, And, Then }) => {
		let first: unknown;
		let second: unknown;
		When('I create a StaffUserPassport with valid staff user', () => {
			passport = new StaffUserPassport(staffUser);
		});
		And('I access the case property twice', () => {
			first = passport.case;
			second = passport.case;
		});
		Then('both accesses should return the same instance', () => {
			expect(first).toBe(second);
		});
	});

	Scenario('Property passport is cached after first access', ({ When, And, Then }) => {
		let first: unknown;
		let second: unknown;
		When('I create a StaffUserPassport with valid staff user', () => {
			passport = new StaffUserPassport(staffUser);
		});
		And('I access the property property twice', () => {
			first = passport.property;
			second = passport.property;
		});
		Then('both accesses should return the same instance', () => {
			expect(first).toBe(second);
		});
	});

	Scenario('User passport is cached after first access', ({ When, And, Then }) => {
		let first: unknown;
		let second: unknown;
		When('I create a StaffUserPassport with valid staff user', () => {
			passport = new StaffUserPassport(staffUser);
		});
		And('I access the user property twice', () => {
			first = passport.user;
			second = passport.user;
		});
		Then('both accesses should return the same instance', () => {
			expect(first).toBe(second);
		});
	});
});
