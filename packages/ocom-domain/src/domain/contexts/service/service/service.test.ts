import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { expect, vi } from 'vitest';
import { Service, type ServiceProps } from './service.ts';
import { DomainSeedwork } from '@cellix/domain-seedwork';
import type { Passport } from '../../passport.ts';
import type { CommunityEntityReference, CommunityProps } from '../../community/community/community.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feature = await loadFeature(
  path.resolve(__dirname, 'features/service.feature'),
);

function makePassport(overrides: Partial<{ canManageServices: boolean }> = {}) {
  return vi.mocked({
    community: {
        forCommunity: vi.fn(),
    },
    service: {
      forService: vi.fn(() => ({
        determineIf: (fn: (p: { canManageServices: boolean }) => boolean) =>
          fn({
            canManageServices: overrides.canManageServices ?? true,
          }),
      })),
    },
  } as unknown as Passport);
}

function makeCommunityEntityReference(id = 'community-1'): CommunityEntityReference {
  return {
    id,
    name: 'Test Community',
  } as CommunityProps;
}

function makeBaseProps(overrides: Partial<ServiceProps> = {}): ServiceProps {
  return {
    id: 'service-1',
    community: makeCommunityEntityReference(),
    setCommunityRef: vi.fn(),
    serviceName: 'Test Service',
    description: 'A test service',
    isActive: true,
    createdAt: new Date('2020-01-01T00:00:00Z'),
    updatedAt: new Date('2020-01-02T00:00:00Z'),
    schemaVersion: '1.0.0',
    ...overrides,
  };
}

describeFeature(feature, ({ Scenario, Background, BeforeEachScenario }) => {
  let passport: Passport;
  let baseProps: ServiceProps;
  let communityRef: CommunityEntityReference;
  let service: Service<ServiceProps>;
  let newService: Service<ServiceProps>;

  BeforeEachScenario(() => {
    passport = makePassport();
    communityRef = makeCommunityEntityReference();
    baseProps = makeBaseProps();
    service = new Service(baseProps, passport);
    newService = undefined as unknown as Service<ServiceProps>;
  });

  Background(({ Given, And }) => {
    Given('a valid Passport with service permissions', () => {
      passport = makePassport({ canManageServices: true });
    });
    And('a valid CommunityEntityReference', () => {
      communityRef = makeCommunityEntityReference();
    });
    And('base service properties with serviceName "Test Service", description "A test service", isActive true, a valid community, and valid timestamps', () => {
      baseProps = makeBaseProps();
      service = new Service(baseProps, passport);
    });
  });

  Scenario('Creating a new service instance', ({ When, Then, And }) => {
    When('I create a new Service aggregate using getNewInstance with serviceName "New Service", description "A new service", and a CommunityEntityReference', () => {
      newService = Service.getNewInstance(
        makeBaseProps(),
        'New Service',
        'A new service',
        communityRef,
        passport
      );
    });
    Then('the service\'s serviceName should be "New Service"', () => {
      expect(newService.serviceName).toBe('New Service');
    });
    And('the service\'s description should be "A new service"', () => {
      expect(newService.description).toBe('A new service');
    });
    And('the service\'s community should reference the provided CommunityEntityReference', () => {
      expect(newService.community.id).toBe(communityRef.id);
    });
    And('the service\'s isActive should be true', () => {
      expect(newService.isActive).toBe(true);
    });
  });

  Scenario('Changing the serviceName with permission to manage services', ({ Given, When, Then }) => {
    Given('a Service aggregate with permission to manage services', () => {
      passport = makePassport({ canManageServices: true });
      service = new Service(makeBaseProps(), passport);
    });
    When('I set the serviceName to "Updated Service"', () => {
      service.serviceName = 'Updated Service';
    });
    Then('the service\'s serviceName should be "Updated Service"', () => {
      expect(service.serviceName).toBe('Updated Service');
    });
  });

  Scenario('Changing the serviceName without permission', ({ Given, When, Then }) => {
    let changeServiceNameWithoutPermission: () => void;
    Given('a Service aggregate without permission to manage services', () => {
      passport = makePassport({ canManageServices: false });
      service = new Service(makeBaseProps(), passport);
    });
    When('I try to set the serviceName to "Updated Service"', () => {
      changeServiceNameWithoutPermission = () => {
        service.serviceName = 'Updated Service';
      };
    });
    Then('a PermissionError should be thrown', () => {
      expect(changeServiceNameWithoutPermission).toThrow(DomainSeedwork.PermissionError);
      expect(changeServiceNameWithoutPermission).toThrow('You do not have permission to change the service name');
    });
  });

  Scenario('Changing the serviceName to an invalid value', ({ Given, When, Then }) => {
    let changeServiceNameToNull: () => void;
    let changeServiceNameToEmpty: () => void;
    Given('a Service aggregate with permission to manage services', () => {
      passport = makePassport({ canManageServices: true });
      service = new Service(makeBaseProps(), passport);
    });
    When('I try to set the serviceName to an invalid value (e.g., null or empty string)', () => {
      changeServiceNameToNull = () => {
        // @ts-expect-error
        service.serviceName = null;
      };
      changeServiceNameToEmpty = () => {
        service.serviceName = '';
      };
    });
    Then('an error should be thrown indicating the value is invalid', () => {
      expect(changeServiceNameToNull).toThrow('Wrong raw value type');
      expect(changeServiceNameToEmpty).toThrow('Too short');
    });
  });

  Scenario('Changing the description with permission to manage services', ({ Given, When, Then }) => {
    Given('a Service aggregate with permission to manage services', () => {
      passport = makePassport({ canManageServices: true });
      service = new Service(makeBaseProps(), passport);
    });
    When('I set the description to "Updated description"', () => {
      service.description = 'Updated description';
    });
    Then('the service\'s description should be "Updated description"', () => {
      expect(service.description).toBe('Updated description');
    });
  });

  Scenario('Changing the description without permission', ({ Given, When, Then }) => {
    let changeDescriptionWithoutPermission: () => void;
    Given('a Service aggregate without permission to manage services', () => {
      passport = makePassport({ canManageServices: false });
      service = new Service(makeBaseProps(), passport);
    });
    When('I try to set the description to "Updated description"', () => {
      changeDescriptionWithoutPermission = () => {
        service.description = 'Updated description';
      };
    });
    Then('a PermissionError should be thrown', () => {
      expect(changeDescriptionWithoutPermission).toThrow(DomainSeedwork.PermissionError);
      expect(changeDescriptionWithoutPermission).toThrow('You do not have permission to change the service description');
    });
  });

  Scenario('Changing the description to an invalid value', ({ Given, When, Then }) => {
    let changeDescriptionToNull: () => void;
    let changeDescriptionToEmpty: () => void;
    Given('a Service aggregate with permission to manage services', () => {
      passport = makePassport({ canManageServices: true });
      service = new Service(makeBaseProps(), passport);
    });
    When('I try to set the description to an invalid value (e.g., null or empty string)', () => {
      changeDescriptionToNull = () => {
        // @ts-expect-error
        service.description = null;
      };
      changeDescriptionToEmpty = () => {
        service.description = '';
      };
    });
    Then('an error should be thrown indicating the value is invalid', () => {
      expect(changeDescriptionToNull).toThrow('Wrong raw value type');
      expect(changeDescriptionToEmpty).toThrow('Too short');
    });
  });

  Scenario('Changing isActive with permission to manage services', ({ Given, When, Then }) => {
    Given('a Service aggregate with permission to manage services', () => {
      passport = makePassport({ canManageServices: true });
      service = new Service(makeBaseProps(), passport);
    });
    When('I set isActive to false', () => {
      service.isActive = false;
    });
    Then('the service\'s isActive should be false', () => {
      expect(service.isActive).toBe(false);
    });
  });

  Scenario('Changing isActive without permission', ({ Given, When, Then }) => {
    let changeIsActiveWithoutPermission: () => void;
    Given('a Service aggregate without permission to manage services', () => {
      passport = makePassport({ canManageServices: false });
      service = new Service(makeBaseProps(), passport);
    });
    When('I try to set isActive to false', () => {
      changeIsActiveWithoutPermission = () => {
        service.isActive = false;
      };
    });
    Then('a PermissionError should be thrown', () => {
      expect(changeIsActiveWithoutPermission).toThrow(DomainSeedwork.PermissionError);
      expect(changeIsActiveWithoutPermission).toThrow('You do not have permission to change the service status');
    });
  });

  Scenario('Getting createdAt, updatedAt, and schemaVersion', ({ Given, Then, And }) => {
    Given('a Service aggregate', () => {
      passport = makePassport({ canManageServices: true });
      baseProps = makeBaseProps();
      service = new Service(baseProps, passport);
    });
    Then('the createdAt property should return the correct date', () => {
      expect(service.createdAt).toEqual(new Date('2020-01-01T00:00:00Z'));
    });
    And('the updatedAt property should return the correct date', () => {
      expect(service.updatedAt).toEqual(new Date('2020-01-02T00:00:00Z'));
    });
    And('the schemaVersion property should return the correct version', () => {
      expect(service.schemaVersion).toBe('1.0.0');
    });
  });
});