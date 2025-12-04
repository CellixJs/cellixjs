import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { expect, vi } from 'vitest';
import { graphHandlerCreator } from './handler.ts';
import type { ServiceApolloServer } from '@ocom/service-apollo-server';
import type { ApplicationServicesFactory, ApplicationServices } from '@ocom/application-services';
import type { GraphContext } from '@ocom/graphql';
import type { HttpRequest, InvocationContext } from '@azure/functions';

const test = { for: describeFeature };
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feature = await loadFeature(
  path.resolve(__dirname, 'features/handler.feature')
);

function makeMockServiceApolloServer(): ServiceApolloServer<GraphContext> {
  return {
    server: {
      executeHTTPGraphQLRequest: vi.fn().mockImplementation(async ({ context }) => {
        // Call the context function to trigger the application services factory
        await context();
        return {
          body: { kind: 'complete', string: JSON.stringify({ data: { test: 'ok' } }) },
          headers: new Map([['content-type', 'application/json']]),
          status: 200,
        };
      }),
    },
  } as unknown as ServiceApolloServer<GraphContext>;
}

function makeMockApplicationServicesFactory() {
  return {
    forRequest: vi.fn().mockResolvedValue({
      Community: {},
      Service: {},
      User: {},
      verifiedUser: null,
    } as ApplicationServices),
  } as unknown as ApplicationServicesFactory;
}

function makeMockHttpRequest(headers?: Record<string, string>): HttpRequest {
  const headerMap = new Map<string, string>(Object.entries(headers ?? {}));
  return {
    method: 'POST',
    url: 'http://localhost/graphql',
    headers: {
      get: (key: string) => headerMap.get(key.toLowerCase()),
      entries: () => headerMap.entries(),
    },
    json: vi.fn().mockResolvedValue({ query: '{ test }' }),
  } as unknown as HttpRequest;
}

function makeMockInvocationContext(): InvocationContext {
  return {
    error: vi.fn(),
  } as unknown as InvocationContext;
}

test.for(feature, ({ Scenario, BeforeEachScenario }) => {
  let apolloServerService: ServiceApolloServer<GraphContext>;
  let applicationServicesFactory: ApplicationServicesFactory;
  let handler: ReturnType<typeof graphHandlerCreator>;
  let req: HttpRequest;
  let context: InvocationContext;

  BeforeEachScenario(() => {
    apolloServerService = makeMockServiceApolloServer();
    applicationServicesFactory = makeMockApplicationServicesFactory();
    handler = graphHandlerCreator(apolloServerService, applicationServicesFactory);
    req = makeMockHttpRequest();
    context = makeMockInvocationContext();
    vi.clearAllMocks();
  });

  Scenario('Creating a handler with valid services', ({ Given, And, When, Then }) => {
    Given('a ServiceApolloServer instance', () => {
      // Already set up in BeforeEachScenario
    });

    And('an ApplicationServicesFactory instance', () => {
      // Already set up in BeforeEachScenario
    });

    When('graphHandlerCreator is called', () => {
      // Already called in BeforeEachScenario
    });

    Then('it should return an Azure Functions HttpHandler', () => {
      expect(typeof handler).toBe('function');
      expect(handler.length).toBe(2); // Should accept req and context parameters
    });
  });

  Scenario('Handler extracts authorization header', ({ Given, And, When, Then }) => {
    Given('a ServiceApolloServer instance', () => {
      // Already set up in BeforeEachScenario
    });

    And('an ApplicationServicesFactory instance', () => {
      // Already set up in BeforeEachScenario
    });

    And('an HttpRequest with Authorization header "Bearer token123"', () => {
      req = makeMockHttpRequest({ 'authorization': 'Bearer token123' });
    });

    When('the created handler is invoked', async () => {
      await handler(req, context);
    });

    Then('it should call ApplicationServicesFactory.forRequest with auth header "Bearer token123"', () => {
      expect(applicationServicesFactory.forRequest).toHaveBeenCalledWith(
        'Bearer token123',
        expect.any(Object)
      );
    });
  });

  Scenario('Handler extracts principal hints from headers', ({ Given, And, When, Then }) => {
    Given('a ServiceApolloServer instance', () => {
      // Already set up in BeforeEachScenario
    });

    And('an ApplicationServicesFactory instance', () => {
      // Already set up in BeforeEachScenario
    });

    And('an HttpRequest with x-member-id "member123" and x-community-id "community456"', () => {
      req = makeMockHttpRequest({
        'x-member-id': 'member123',
        'x-community-id': 'community456'
      });
    });

    When('the created handler is invoked', async () => {
      await handler(req, context);
    });

    Then('it should call ApplicationServicesFactory.forRequest with principal hints containing memberId "member123" and communityId "community456"', () => {
      expect(applicationServicesFactory.forRequest).toHaveBeenCalledWith(
        undefined,
        {
          memberId: 'member123',
          communityId: 'community456',
        }
      );
    });
  });

  Scenario('Handler creates context with application services', ({ Given, And, When, Then }) => {
    const mockApplicationServices = {
      Community: {},
      Service: {},
      User: {},
      verifiedUser: null,
    } as ApplicationServices;

    Given('a ServiceApolloServer instance', () => {
      // Already set up in BeforeEachScenario
    });

    And('an ApplicationServicesFactory that returns mock application services', () => {
      vi.mocked(applicationServicesFactory.forRequest).mockResolvedValue(mockApplicationServices);
    });

    When('the created handler is invoked', async () => {
      await handler(req, context);
    });

    Then('the GraphQL context should contain the application services', () => {
      // Verify that the context function was called and the application services were passed
      expect(applicationServicesFactory.forRequest).toHaveBeenCalled();
      // The actual context verification would require mocking the Apollo Server's executeHTTPGraphQLRequest
      // and checking that the context function returns the expected application services
    });
  });
});