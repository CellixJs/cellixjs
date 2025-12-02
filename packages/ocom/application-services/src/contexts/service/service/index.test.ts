import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { expect, vi } from 'vitest';
import type { Domain } from '@ocom/domain';
import type { DataSources } from '@ocom/persistence';

// Mock the create module
vi.mock('./create.ts', () => ({
  create: vi.fn(),
}));

import { Service } from './index.ts';
import { create } from './create.ts';

const test = { for: describeFeature };
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feature = await loadFeature(
  path.resolve(__dirname, 'features/index.feature')
);

function makeMockService(overrides: Partial<Domain.Contexts.Service.Service.ServiceEntityReference> = {}) {
  return {
    id: '507f1f77bcf86cd799439011',
    serviceName: 'Test Service',
    description: 'A test service',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    schemaVersion: '1.0',
    ...overrides,
  // biome-ignore lint/plugin/no-type-assertion: test file
  } as Domain.Contexts.Service.Service.ServiceEntityReference;
}

test.for(feature, ({ Scenario, BeforeEachScenario }) => {
  let dataSources: DataSources;
  let service: ReturnType<typeof Service>;

  BeforeEachScenario(() => {
    // Reset mocks
    vi.clearAllMocks();

    // Set up mock implementation
    const mockCreateFn = vi.fn().mockResolvedValue(makeMockService({ serviceName: 'Test Service' }));

    vi.mocked(create).mockReturnValue(mockCreateFn);

    dataSources = {
      domainDataSource: {
        Service: {
          Service: {
            ServiceUnitOfWork: {
              withScopedTransaction: vi.fn(),
            },
          },
        },
      },
    // biome-ignore lint/plugin/no-type-assertion: test file
    } as unknown as DataSources;

    service = Service(dataSources);
  });

  Scenario('Creating a service through the application service', ({ Given, When, Then }) => {
    let result: Domain.Contexts.Service.Service.ServiceEntityReference;

    Given('a service application service', () => {
      expect(service).toBeDefined();
    });

    When('I create a service with name "Test Service"', async () => {
      result = await service.create({
        serviceName: 'Test Service',
        description: 'A test service',
        communityId: 'community123'
      });
    });

    Then('it should delegate to the create function', () => {
      expect(result).toBeDefined();
      expect(result.serviceName).toBe('Test Service');
    });
  });
});