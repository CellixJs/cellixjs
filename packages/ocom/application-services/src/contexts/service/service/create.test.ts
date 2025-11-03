import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { expect, vi } from 'vitest';
import type { Domain } from '@ocom/domain';
import type { DataSources } from '@ocom/persistence';
import { create } from './create.ts';

const test = { for: describeFeature };
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feature = await loadFeature(
  path.resolve(__dirname, 'features/create.feature')
);

function makeMockCommunity(overrides: Partial<Domain.Contexts.Community.Community.CommunityEntityReference> = {}) {
  return {
    id: '507f1f77bcf86cd799439011',
    name: 'Test Community',
    ...overrides,
  } as Domain.Contexts.Community.Community.CommunityEntityReference;
}

function makeMockService(overrides: Partial<Domain.Contexts.Service.Service.ServiceEntityReference> = {}) {
  return {
    id: '507f1f77bcf86cd799439012',
    serviceName: 'Test Service',
    description: 'Test Description',
    ...overrides,
  } as Domain.Contexts.Service.Service.ServiceEntityReference;
}

test.for(feature, ({ Scenario, BeforeEachScenario }) => {
  let dataSources: DataSources;
  let createService: (command: { serviceName: string; description: string; communityId: string }) => Promise<Domain.Contexts.Service.Service.ServiceEntityReference>;

  BeforeEachScenario(() => {
    dataSources = {
      readonlyDataSource: {
        Community: {
          Community: {
            CommunityReadRepo: {
              getById: vi.fn(),
            },
          },
        },
      },
      domainDataSource: {
        Service: {
          Service: {
            ServiceUnitOfWork: {
              withScopedTransaction: vi.fn(),
            },
          },
        },
      },
    } as unknown as DataSources;

    createService = create(dataSources);
  });

  Scenario('Creating a service successfully', ({ Given, When, Then }) => {
    let result: Domain.Contexts.Service.Service.ServiceEntityReference;

    Given('a valid community exists with id "507f1f77bcf86cd799439011"', () => {
      vi.mocked(dataSources.readonlyDataSource.Community.Community.CommunityReadRepo.getById).mockResolvedValue(makeMockCommunity({ id: '507f1f77bcf86cd799439011' }));
    });

    When('I create a service with name "Test Service", description "Test Description", and communityId "507f1f77bcf86cd799439011"', async () => {
      const mockRepo = {
        get: vi.fn(),
        getById: vi.fn(),
        getNewInstance: vi.fn().mockResolvedValue(makeMockService({ serviceName: 'Test Service', description: 'Test Description' })),
        save: vi.fn().mockResolvedValue(makeMockService({ serviceName: 'Test Service', description: 'Test Description' })),
      };

      vi.mocked(dataSources.domainDataSource.Service.Service.ServiceUnitOfWork.withScopedTransaction).mockImplementation(async (callback) => {
        await callback(mockRepo);
      });

      result = await createService({ serviceName: 'Test Service', description: 'Test Description', communityId: '507f1f77bcf86cd799439011' });
    });

    Then('it should return a service entity reference with name "Test Service" and description "Test Description"', () => {
      expect(result).toBeDefined();
      expect(result.serviceName).toBe('Test Service');
      expect(result.description).toBe('Test Description');
    });
  });

  Scenario('Creating a service with non-existent community', ({ Given, When, Then }) => {
    let error: Error;

    Given('no community exists with id "507f1f77bcf86cd799439011"', () => {
      vi.mocked(dataSources.readonlyDataSource.Community.Community.CommunityReadRepo.getById).mockResolvedValue(null);
    });

    When('I create a service with name "Test Service", description "Test Description", and communityId "507f1f77bcf86cd799439011"', async () => {
      try {
        await createService({ serviceName: 'Test Service', description: 'Test Description', communityId: '507f1f77bcf86cd799439011' });
      } catch (err) {
        error = err as Error;
      }
    });

    Then('it should throw an error "Community not found"', () => {
      expect(error).toBeDefined();
      expect(error.message).toBe('Community not found');
    });
  });

  Scenario('Creating a service when save fails', ({ Given, When, Then }) => {
    let error: Error;

    Given('a valid community exists with id "507f1f77bcf86cd799439011"', () => {
      vi.mocked(dataSources.readonlyDataSource.Community.Community.CommunityReadRepo.getById).mockResolvedValue(makeMockCommunity({ id: '507f1f77bcf86cd799439011' }));
    });

    When('I create a service but save fails', async () => {
      const mockRepo = {
        get: vi.fn(),
        getById: vi.fn(),
        getNewInstance: vi.fn().mockResolvedValue(makeMockService({ serviceName: 'Test Service', description: 'Test Description' })),
        save: vi.fn().mockResolvedValue(undefined), // Simulate save failure
      };

      vi.mocked(dataSources.domainDataSource.Service.Service.ServiceUnitOfWork.withScopedTransaction).mockImplementation(async (callback) => {
        await callback(mockRepo);
      });

      try {
        await createService({ serviceName: 'Test Service', description: 'Test Description', communityId: '507f1f77bcf86cd799439011' });
      } catch (err) {
        error = err as Error;
      }
    });

    Then('it should throw an error "service not found"', () => {
      expect(error).toBeDefined();
      expect(error.message).toBe('service not found');
    });
  });
});