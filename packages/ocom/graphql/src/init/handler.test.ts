import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { expect, vi } from 'vitest';
import { graphHandlerCreator } from './handler.ts';
import type { ApplicationServicesFactory } from '@ocom/application-services';
import type { HttpRequest, InvocationContext } from '@azure/functions';
import { ApolloServer } from '@apollo/server';
import { startServerAndCreateHandler } from './azure-functions.ts';

// Mocks

const test = { for: describeFeature };
vi.mock('./azure-functions.ts');
vi.mock('../schema/builder/schema-builder.ts', () => ({
  combinedSchema: {},
}));
vi.mock('graphql-middleware', () => ({
  applyMiddleware: vi.fn(() => ({})),
}));
vi.mock('@apollo/server');

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feature = await loadFeature(
  path.resolve(__dirname, 'features/handler.feature')
);

function makeMockApplicationServicesFactory(): ApplicationServicesFactory {
  return {
    forRequest: vi.fn(),
  } as unknown as ApplicationServicesFactory;
}

function makeMockHttpRequest(headers?: Record<string, string>): HttpRequest {
  const headerMap = new Map<string, string>();
  for (const [key, value] of Object.entries(headers ?? {})) {
    headerMap.set(key.toLowerCase(), value);
  }
  return {
    method: 'POST',
    url: 'http://localhost/graphql',
    headers: {
      get: (key: string) => headerMap.get(key.toLowerCase()),
      entries: () => headerMap.entries(),
    },
    json: async () => ({}),
  } as unknown as HttpRequest;
}

function makeMockInvocationContext(): InvocationContext {
  return {
    error: vi.fn(),
  } as unknown as InvocationContext;
}

test.for(feature, ({ Scenario, BeforeEachScenario }) => {
  let factory: ApplicationServicesFactory;
  let handler: ReturnType<typeof graphHandlerCreator>;
  let req: HttpRequest;
  let context: InvocationContext;

  BeforeEachScenario(() => {
    factory = makeMockApplicationServicesFactory();
    context = makeMockInvocationContext();
    vi.clearAllMocks();
    vi.mocked(startServerAndCreateHandler).mockReturnValue(vi.fn());
  });

  Scenario('Creating a handler with a valid ApplicationServicesFactory', ({ Given, When, Then, And }) => {
    Given('a valid ApplicationServicesFactory', () => {
      // Already set up in BeforeEachScenario
    });

    When('graphHandlerCreator is called with the factory', () => {
      handler = graphHandlerCreator(factory);
    });

    Then('it should create an ApolloServer with the combined schema and middleware', () => {
      expect(ApolloServer).toHaveBeenCalledWith({
        schema: {},
        cors: {
          origin: true,
          credentials: true,
        },
        allowBatchedHttpRequests: true,
      });
    });

    And('it should configure CORS and allow batched HTTP requests', () => {
      // Already checked in the above assertion
    });

    And('it should return an Azure Functions HttpHandler', () => {
      expect(startServerAndCreateHandler).toHaveBeenCalled();
      expect(typeof handler).toBe('function');
    });
  });

  Scenario('Handler context creation with headers', ({ Given, And, When, Then }) => {
    const authHeader = 'Bearer token';
    const memberId = 'member123';
    const communityId = 'community456';

    Given('a handler created by graphHandlerCreator', () => {
      handler = graphHandlerCreator(factory);
    });

    And('an incoming request with Authorization, x-member-id, and x-community-id headers', () => {
      req = makeMockHttpRequest({
        'Authorization': authHeader,
        'x-member-id': memberId,
        'x-community-id': communityId,
      });
    });

    When('the handler is invoked', async () => {
      vi.mocked(startServerAndCreateHandler).mockImplementation((_server, options) => {
        return async (req, context) => {
          await options.context({ req, context });
          return { status: 200, body: 'OK' };
        };
      });
      handler = graphHandlerCreator(factory);
      const result = await handler(req, context);
      expect(result.status).toBe(200);
    });

    Then('it should call applicationServicesFactory.forRequest with the Authorization header and hints', () => {
      expect(vi.mocked(factory.forRequest)).toHaveBeenCalledWith(authHeader, {
        memberId,
        communityId,
      });
    });

    And('it should inject the resulting applicationServices into the GraphQL context', () => {
      expect(vi.mocked(factory.forRequest)).toHaveBeenCalled();
    });
  });

  Scenario('Handler delegates to startServerAndCreateHandler', ({ Given, When, Then, And }) => {
    const mockResponse = { status: 200, body: 'OK' };

    Given('a handler created by graphHandlerCreator', () => {
      const mockHandler = vi.fn().mockResolvedValue(mockResponse);
      vi.mocked(startServerAndCreateHandler).mockReturnValue(mockHandler);
      handler = graphHandlerCreator(factory);
    });

    When('the handler is invoked', async () => {
      req = makeMockHttpRequest();
      const result = await handler(req, context);
      expect(result).toEqual(mockResponse);
    });

    Then('it should delegate the request to startServerAndCreateHandler with the ApolloServer and context options', () => {
      expect(startServerAndCreateHandler).toHaveBeenCalled();
    });

    And('it should return the result from startServerAndCreateHandler', () => {
      // Already checked in When
    });
  });
});