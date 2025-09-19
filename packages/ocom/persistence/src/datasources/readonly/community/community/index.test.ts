import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { expect, vi } from 'vitest';
import type { Models } from '@ocom/data-sources-mongoose-models';
import type { Domain } from '@ocom/domain';
import type { ModelsContext } from '../../../../index.ts';
import { CommunityReadRepositoryImpl } from './index.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feature = await loadFeature(
  path.resolve(__dirname, 'features/index.feature')
);

function makeMockModelsContext() {
  return {
    Community: {
      Community: {
        findById: vi.fn(),
        find: vi.fn(),
        create: vi.fn(),
        aggregate: vi.fn(),
      } as unknown as Models.Community.CommunityModelType,
    },
  } as ModelsContext;
}

function makeMockPassport() {
  return {
    community: {
      forCommunity: vi.fn(() => ({
        determineIf: vi.fn(() => true),
      })),
    },
  } as unknown as Domain.Passport;
}

describeFeature(feature, ({ Scenario, Background, BeforeEachScenario }) => {
  let models: ModelsContext;
  let passport: Domain.Passport;
  let result: ReturnType<typeof CommunityReadRepositoryImpl>;

  BeforeEachScenario(() => {
    models = makeMockModelsContext();
    passport = makeMockPassport();
    result = {} as ReturnType<typeof CommunityReadRepositoryImpl>;
  });

  Background(({ Given, And }) => {
    Given('a valid models context with Community model', () => {
      // Setup is done in BeforeEachScenario
    });

    And('a valid passport for domain operations', () => {
      // Setup is done in BeforeEachScenario
    });
  });

  Scenario('Creating Community Read Repository Implementation', ({ When, Then, And }) => {
    When('I call CommunityReadRepositoryImpl with models and passport', () => {
      result = CommunityReadRepositoryImpl(models, passport);
    });

    Then('I should receive a CommunityReadRepositoryImpl object', () => {
      expect(result).toBeDefined();
      expect(typeof result).toBe('object');
    });

    And('the CommunityReadRepositoryImpl should have CommunityReadRepo property', () => {
      expect(result).toHaveProperty('CommunityReadRepo');
      expect(typeof result.CommunityReadRepo).toBe('object');
    });

    And('the CommunityReadRepo should be a CommunityReadRepository instance', () => {
      expect(result.CommunityReadRepo).toBeDefined();
      expect(typeof result.CommunityReadRepo.getAll).toBe('function');
      expect(typeof result.CommunityReadRepo.getById).toBe('function');
      expect(typeof result.CommunityReadRepo.getByIdWithCreatedBy).toBe('function');
      expect(typeof result.CommunityReadRepo.getByEndUserExternalId).toBe('function');
    });
  });
});