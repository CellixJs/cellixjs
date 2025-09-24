import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { expect, vi } from 'vitest';
import { startServerAndCreateHandler } from './azure-functions.ts';
import type { ApolloServer, BaseContext, HeaderMap } from '@apollo/server';
import type { HttpRequest, InvocationContext, HttpResponseInit } from '@azure/functions-v4';


const test = { for: describeFeature };
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feature = await loadFeature(
  path.resolve(__dirname, 'features/azure-functions.feature')
);

function makeMockApolloServer() {
  return {
    startInBackgroundHandlingStartupErrorsByLoggingAndFailingAllRequests: vi.fn(),
    executeHTTPGraphQLRequest: vi.fn(),
  } as unknown as ApolloServer<BaseContext>;
}

function makeMockHttpRequest(method: string, url: string, headers?: Record<string, string>, body?: unknown): HttpRequest {
  const headerMap = new Map<string, string>(Object.entries(headers ?? {}));
  return {
    method,
    url,
    headers: {
      get: (key: string) => headerMap.get(key.toLowerCase()),
      entries: () => headerMap.entries(),
    },
    json: async () => body,
  } as unknown as HttpRequest;
}

function makeMockInvocationContext() {
  return {
    error: vi.fn(),
  } as unknown as InvocationContext;
}

test.for(feature, ({ Scenario, BeforeEachScenario }) => {
  let server: ApolloServer<BaseContext>;
  let handler: ReturnType<typeof startServerAndCreateHandler>;
  let req: HttpRequest;
  let context: InvocationContext;

  BeforeEachScenario(() => {
    server = makeMockApolloServer();
    context = makeMockInvocationContext();
    vi.clearAllMocks();
  });

  Scenario('Handling a valid GraphQL POST request', ({ Given, And, When, Then }) => {
    let response: HttpResponseInit;
    const query = '{ hello }';
    const resultBody = JSON.stringify({ data: { hello: 'world' } });

    Given('an initialized ApolloServer instance', () => {
      // Already set up in BeforeEachScenario
    });

    And('a valid POST HttpRequest with a JSON body containing a GraphQL query', () => {
      req = makeMockHttpRequest('POST', 'http://localhost/graphql', { 'content-type': 'application/json' }, { query });
    });

    When('the Azure Functions handler is invoked', async () => {
      vi.mocked(server).executeHTTPGraphQLRequest.mockResolvedValue({
        body: { kind: 'complete', string: resultBody },
        headers: Object.assign(new Map([['content-type', 'application/json']]), { __identity: 'HeaderMap' }) as unknown as HeaderMap,
        status: 200,
      });
      handler = startServerAndCreateHandler(server);
      response = await handler(req, context);
    });

    Then('it should call ApolloServer.executeHTTPGraphQLRequest with the normalized request', () => {
      expect(server.executeHTTPGraphQLRequest).toHaveBeenCalled();
      const { calls } = vi.mocked(server).executeHTTPGraphQLRequest.mock;
      expect(calls).toHaveLength(1);
      const call = calls[0]?.[0];
      expect(call?.httpGraphQLRequest.method).toBe('POST');
      expect(call?.httpGraphQLRequest.body).toEqual({ query });
    });

    And('it should return a 200 response with the GraphQL result', () => {
      expect(response.status).toBe(200);
      expect(response.body).toBe(resultBody);
    });
  });

  Scenario('Handling a valid GraphQL GET request', ({ Given, And, When, Then }) => {
    let response: HttpResponseInit;
    const url = 'http://localhost/graphql?query=%7B%20hello%20%7D';
    const resultBody = JSON.stringify({ data: { hello: 'world' } });

    Given('an initialized ApolloServer instance', () => {
      // Already set up in BeforeEachScenario
    });

    And('a valid GET HttpRequest with a query string containing a GraphQL query', () => {
      req = makeMockHttpRequest('GET', url, { });
    });

    When('the Azure Functions handler is invoked', async () => {
      vi.mocked(server).executeHTTPGraphQLRequest.mockResolvedValue({
        body: { kind: 'complete', string: resultBody },
        headers: Object.assign(new Map([['content-type', 'application/json']]), { __identity: 'HeaderMap' }) as unknown as HeaderMap,
        status: 200,
      });
      handler = startServerAndCreateHandler(server);
      response = await handler(req, context);
    });

    Then('it should call ApolloServer.executeHTTPGraphQLRequest with the normalized request', () => {
      expect(server.executeHTTPGraphQLRequest).toHaveBeenCalled();
      const { calls } = vi.mocked(server).executeHTTPGraphQLRequest.mock;
      expect(calls).toHaveLength(1);
      const call = calls[0]?.[0];
      expect(call?.httpGraphQLRequest.method).toBe('GET');
      expect(call?.httpGraphQLRequest.search).toBe('?query=%7B%20hello%20%7D');
    });

    And('it should return a 200 response with the GraphQL result', () => {
      expect(response.status).toBe(200);
      expect(response.body).toBe(resultBody);
    });
  });

  Scenario('Handling a request with chunked response', ({ Given, When, Then }) => {
    let response: HttpResponseInit;

    Given('ApolloServer.executeHTTPGraphQLRequest returns a body with kind "chunked"', () => {
      req = makeMockHttpRequest('POST', 'http://localhost/graphql', { 'content-type': 'application/json' }, { query: '{ hello }' });
      const dummyIterator = {
        next: vi.fn().mockResolvedValue({ done: true, value: undefined }),
        [Symbol.asyncIterator]: function() { return this; }
      } as AsyncIterableIterator<string>;
      vi.mocked(server).executeHTTPGraphQLRequest.mockResolvedValue({
        body: { kind: 'chunked', asyncIterator: dummyIterator },
        headers: Object.assign(new Map([['content-type', 'application/json']]), { __identity: 'HeaderMap' }) as unknown as HeaderMap,
        status: 200,
      });
    });

    When('the Azure Functions handler is invoked', async () => {
      handler = startServerAndCreateHandler(server);
      response = await handler(req, context);
    });

    Then('it should return a 501 response with an error message about incremental delivery', () => {
      expect(response.status).toBe(501);
      expect(response.body).toContain('Incremental delivery (chunked responses) is not implemented.');
    });
  });

  Scenario('Handling a request with missing HTTP method', ({ Given, When, Then }) => {
    let response: HttpResponseInit;

    Given('an HttpRequest with no method property', () => {
      req = makeMockHttpRequest(undefined as unknown as string, 'http://localhost/graphql', { 'content-type': 'application/json' }, { query: '{ hello }' });
    });

    When('the Azure Functions handler is invoked', async () => {
      handler = startServerAndCreateHandler(server);
      response = await handler(req, context);
    });

    Then('it should return a 400 response with an error message about missing method', () => {
      expect(response.status).toBe(400);
      expect(response.body).toContain('No method');
    });
  });

  Scenario('Handling a request that throws an error', ({ Given, When, Then, And }) => {
    let response: HttpResponseInit;
    const errorMessage = 'Something went wrong';

    Given('ApolloServer.executeHTTPGraphQLRequest throws an error', () => {
      req = makeMockHttpRequest('POST', 'http://localhost/graphql', { 'content-type': 'application/json' }, { query: '{ hello }' });
      vi.mocked(server).executeHTTPGraphQLRequest.mockImplementation(() => {
        throw new Error(errorMessage);
      });
    });

    When('the Azure Functions handler is invoked', async () => {
      handler = startServerAndCreateHandler(server);
      response = await handler(req, context);
    });

    Then('it should log the error to the InvocationContext', () => {
      expect(context.error).toHaveBeenCalledWith('Failure processing GraphQL request', expect.any(Error));
    });

    And('it should return a 400 response with the error message', () => {
      expect(response.status).toBe(400);
      expect(response.body).toContain(errorMessage);
    });
  });
});