import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { ApolloServer } from '@apollo/server';
import { applyMiddleware } from 'graphql-middleware';
import depthLimit from 'graphql-depth-limit';
import { GraphQLSchema, GraphQLObjectType, GraphQLString } from 'graphql';
import { expect, vi, type MockedFunction } from 'vitest';
import { ServiceApolloServer, type ServiceApolloServerOptions } from './index.ts';

const test = { for: describeFeature };

// Mock ApolloServer
vi.mock('@apollo/server', () => ({
  ApolloServer: vi.fn(),
}));

// Mock graphql-middleware
vi.mock('graphql-middleware', () => ({
  applyMiddleware: vi.fn(),
}));

// Mock graphql-depth-limit
vi.mock('graphql-depth-limit', () => ({
  default: vi.fn(),
}));

// Mock console.log
const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feature = await loadFeature(
  path.resolve(__dirname, 'features/service-apollo-server.feature')
);

// Create a simple test schema
const testSchema = new GraphQLSchema({
  query: new GraphQLObjectType({
    name: 'Query',
    fields: {
      hello: {
        type: GraphQLString,
        resolve: () => 'world',
      },
    },
  }),
});

test.for(feature, ({ Scenario, BeforeEachScenario }) => {
  let service: ServiceApolloServer;
  let mockApolloServer: {
    start: MockedFunction<() => Promise<void>>;
    stop: MockedFunction<() => Promise<void>>;
  };

  BeforeEachScenario(() => {
    // Reset all mocks
    vi.clearAllMocks();
    consoleLogSpy.mockClear();

    // Setup mock ApolloServer
    mockApolloServer = {
      start: vi.fn().mockResolvedValue(undefined),
      stop: vi.fn().mockResolvedValue(undefined),
    };

    (ApolloServer as unknown as ReturnType<typeof vi.fn>).mockImplementation(() => mockApolloServer);
    (applyMiddleware as ReturnType<typeof vi.fn>).mockImplementation((schema: GraphQLSchema) => schema);
    (depthLimit as ReturnType<typeof vi.fn>).mockReturnValue(() => ({}));
  });

  Scenario('Creating a service with schema', ({ Given, When, Then, And }) => {
    let options: ServiceApolloServerOptions;

    Given('a GraphQL schema', () => {
      options = { schema: testSchema };
    });

    When('a ServiceApolloServer is created with the schema', () => {
      service = new ServiceApolloServer(options);
    });

    Then('it should store the options', () => {
      // We can't directly test private properties, but we can test behavior
      expect(service).toBeInstanceOf(ServiceApolloServer);
    });

    And('it should not have started the server', () => {
      expect(ApolloServer).not.toHaveBeenCalled();
    });
  });

  Scenario('Starting up the service successfully', ({ Given, When, Then, And }) => {
    let result: ApolloServer;

    Given('a ServiceApolloServer with a schema', () => {
      service = new ServiceApolloServer({ schema: testSchema });
    });

    When('startUp is called', async () => {
      result = await service.startUp();
    });

    Then('it should create an ApolloServer instance', () => {
      expect(ApolloServer).toHaveBeenCalledWith({
        schema: testSchema,
        introspection: true, // default when NODE_ENV is not 'production'
        allowBatchedHttpRequests: true,
        validationRules: [expect.any(Function)],
      });
    });

    And('it should start the server', () => {
      expect(mockApolloServer.start).toHaveBeenCalled();
    });

    And('it should return the ApolloServer instance', () => {
      expect(result).toBe(mockApolloServer);
    });

    And('it should log "ServiceApolloServer started"', () => {
      expect(consoleLogSpy).toHaveBeenCalledWith('ServiceApolloServer started');
    });
  });

  Scenario('Starting up with middleware applied', ({ Given, When, Then, And }) => {
    const mockMiddleware = vi.fn();

    Given('a ServiceApolloServer with schema and middleware', () => {
      service = new ServiceApolloServer({
        schema: testSchema,
        middleware: mockMiddleware,
      });
    });

    When('startUp is called', async () => {
      await service.startUp();
    });

    Then('it should apply the middleware to the schema', () => {
      expect(applyMiddleware).toHaveBeenCalledWith(testSchema, mockMiddleware);
    });

    And('it should create an ApolloServer with the modified schema', () => {
      expect(ApolloServer).toHaveBeenCalledWith({
        schema: testSchema, // applyMiddleware returns the schema
        introspection: true,
        allowBatchedHttpRequests: true,
        validationRules: [expect.any(Function)],
      });
    });
  });

  Scenario('Starting up with custom options', ({ Given, When, Then, And }) => {
    Given('a ServiceApolloServer with custom introspection, allowBatchedHttpRequests, and maxDepth', () => {
      service = new ServiceApolloServer({
        schema: testSchema,
        introspection: true,
        allowBatchedHttpRequests: false,
        maxDepth: 5,
      });
    });

    When('startUp is called', async () => {
      await service.startUp();
    });

    Then('it should configure the ApolloServer with the custom options', () => {
      expect(ApolloServer).toHaveBeenCalledWith({
        schema: testSchema,
        introspection: true,
        allowBatchedHttpRequests: false,
        validationRules: [expect.any(Function)],
      });
    });

    And('it should apply depthLimit validation rule', () => {
      expect(depthLimit).toHaveBeenCalledWith(5);
    });
  });

  Scenario('Accessing server before startup', ({ Given, When, Then }) => {
    Given('a ServiceApolloServer that has not been started', () => {
      service = new ServiceApolloServer({ schema: testSchema });
    });

    When('the server property is accessed', () => {
      expect(() => service.server).toThrow(
        'ServiceApolloServer is not started - cannot access server'
      );
    });

    Then('it should throw an error indicating the service is not started', () => {
      // Error already thrown in When step
    });
  });

  Scenario('Shutting down the service', ({ Given, When, Then, And }) => {
    Given('a started ServiceApolloServer', async () => {
      service = new ServiceApolloServer({ schema: testSchema });
      await service.startUp();
    });

    When('shutDown is called', async () => {
      await service.shutDown();
    });

    Then('it should stop the ApolloServer', () => {
      expect(mockApolloServer.stop).toHaveBeenCalled();
    });

    And('it should set the server to undefined', () => {
      expect(() => service.server).toThrow();
    });

    And('it should log "ServiceApolloServer stopped"', () => {
      expect(consoleLogSpy).toHaveBeenCalledWith('ServiceApolloServer stopped');
    });
  });

  Scenario('Accessing server after shutdown', ({ Given, When, Then }) => {
    Given('a ServiceApolloServer that has been shut down', async () => {
      service = new ServiceApolloServer({ schema: testSchema });
      await service.startUp();
      await service.shutDown();
    });

    When('the server property is accessed', () => {
      expect(() => service.server).toThrow(
        'ServiceApolloServer is not started - cannot access server'
      );
    });

    Then('it should throw an error indicating the service is not started', () => {
      // Error already thrown in When step
    });
  });

  Scenario('Shutting down before startup', ({ Given, When, Then }) => {
    Given('a ServiceApolloServer that has not been started', () => {
      service = new ServiceApolloServer({ schema: testSchema });
    });

    When('shutDown is called', async () => {
      await expect(service.shutDown()).rejects.toThrow(
        'ServiceApolloServer is not started - shutdown cannot proceed'
      );
    });

    Then('it should throw an error indicating shutdown cannot proceed', () => {
      // Error already thrown in When step
    });
  });
});