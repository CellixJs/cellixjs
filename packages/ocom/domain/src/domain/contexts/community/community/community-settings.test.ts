import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { PermissionError } from '@cellix/domain-seedwork/domain-entity';
import { expect, vi } from 'vitest';
import { CommunityIpAddressUpdatedEvent } from '../../../events/types/community-ip-address-updated.ts';
import type { CommunityDomainPermissions } from '../community.domain-permissions.ts';
import type { CommunityVisa } from '../community.visa.ts';
import { type CommunityAggregateRoot, CommunitySettings, type CommunitySettingsProps } from './community-settings.ts';

const test = { for: describeFeature };
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feature = await loadFeature(path.resolve(__dirname, 'features/community-settings.feature'));

function makeVisa(permissions: Partial<CommunityDomainPermissions>): CommunityVisa {
	return { determineIf: (fn) => fn(permissions as CommunityDomainPermissions) };
}

function makeProps(overrides: Partial<CommunitySettingsProps> = {}): CommunitySettingsProps {
	return {
		ipAddress: undefined,
		countryCode: undefined,
		countryName: undefined,
		...overrides,
	};
}

function makeRoot(): CommunityAggregateRoot {
	return { id: 'community-1', addDomainEvent: vi.fn(), addIntegrationEvent: vi.fn() };
}

test.for(feature, ({ Scenario }) => {
	Scenario('Setting a new IP address with permission', ({ Given, When, Then, And }) => {
		let settings: CommunitySettings;
		let root: CommunityAggregateRoot;
		Given('community settings with permission to manage community settings and an existing country', () => {
			root = makeRoot();
			settings = new CommunitySettings(makeProps({ ipAddress: '203.0.113.10', countryCode: 'US', countryName: 'United States' }), makeVisa({ canManageCommunitySettings: true }), root);
		});
		When('I set the ipAddress to "198.51.100.20"', () => {
			settings.ipAddress = '198.51.100.20';
		});
		Then('the ipAddress should be "198.51.100.20"', () => {
			expect(settings.ipAddress).toBe('198.51.100.20');
		});
		And('the previous country should be cleared', () => {
			expect(settings.countryCode).toBeUndefined();
			expect(settings.countryName).toBeUndefined();
		});
		And('a CommunityIpAddressUpdatedEvent should be raised with the community id and ipAddress', () => {
			expect(root.addIntegrationEvent).toHaveBeenCalledWith(CommunityIpAddressUpdatedEvent, { communityId: 'community-1', ipAddress: '198.51.100.20' });
		});
	});

	Scenario('Setting the same IP address again', ({ Given, When, Then }) => {
		let settings: CommunitySettings;
		let root: CommunityAggregateRoot;
		Given('community settings with ipAddress "198.51.100.20"', () => {
			root = makeRoot();
			settings = new CommunitySettings(makeProps({ ipAddress: '198.51.100.20' }), makeVisa({ canManageCommunitySettings: true }), root);
		});
		When('I set the ipAddress to "198.51.100.20"', () => {
			settings.ipAddress = '198.51.100.20';
		});
		Then('no integration event should be raised', () => {
			expect(root.addIntegrationEvent).not.toHaveBeenCalled();
		});
	});

	Scenario('Setting the IP address without permission', ({ Given, When, Then }) => {
		let settings: CommunitySettings;
		let setIp: () => void;
		Given('community settings without permission to manage community settings', () => {
			settings = new CommunitySettings(makeProps(), makeVisa({}), makeRoot());
		});
		When('I try to set the ipAddress to "198.51.100.20"', () => {
			setIp = () => {
				settings.ipAddress = '198.51.100.20';
			};
		});
		Then('a PermissionError should be thrown', () => {
			expect(setIp).toThrow(PermissionError);
		});
	});

	Scenario('Applying a geolocation as the system account', ({ Given, When, Then, And }) => {
		let settings: CommunitySettings;
		Given('community settings with a system passport', () => {
			settings = new CommunitySettings(makeProps({ ipAddress: '198.51.100.20' }), makeVisa({ isSystemAccount: true }), makeRoot());
		});
		When('I apply a geolocation with countryCode "ca" and countryName "Canada"', () => {
			settings.applyGeolocation({ countryCode: 'ca', countryName: 'Canada' });
		});
		Then('the settings should store countryCode "CA" and countryName "Canada"', () => {
			expect(settings.countryCode).toBe('CA');
			expect(settings.countryName).toBe('Canada');
		});
		And('a missing countryName should be stored as undefined', () => {
			settings.applyGeolocation({ countryCode: 'US' });
			expect(settings.countryCode).toBe('US');
			expect(settings.countryName).toBeUndefined();
		});
	});

	Scenario('Applying a geolocation without the system account', ({ Given, When, Then }) => {
		let settings: CommunitySettings;
		let apply: () => void;
		Given('community settings with permission to manage community settings only', () => {
			settings = new CommunitySettings(makeProps(), makeVisa({ canManageCommunitySettings: true }), makeRoot());
		});
		When('I try to apply a geolocation', () => {
			apply = () => settings.applyGeolocation({ countryCode: 'CA' });
		});
		Then('a PermissionError should be thrown', () => {
			expect(apply).toThrow(PermissionError);
		});
	});
});
