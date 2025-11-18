import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';
import { CommunityProvisioningServiceInstance } from './community-provisioning.service.ts';


const test = { for: describeFeature };
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feature = await loadFeature(
  path.resolve(__dirname, 'features/index.feature'),
);

test.for(feature, ({ Scenario }) => {
  Scenario('Exporting CommunityProvisioningService', ({ Given, When, Then, And }) => {
    Given('the community services index module', () => {
      // Module is already imported
    });

    When('I import the CommunityProvisioningServiceInstance', () => {
      // Already imported
    });

    Then('it should contain a CommunityProvisioningService instance', () => {
      expect(CommunityProvisioningServiceInstance).toBeDefined();
      expect(typeof CommunityProvisioningServiceInstance).toBe('object');
    });

    And('the CommunityProvisioningService should have a provisionMemberAndDefaultRole method', () => {
      expect(typeof CommunityProvisioningServiceInstance.provisionMemberAndDefaultRole).toBe('function');
    });
  });
});