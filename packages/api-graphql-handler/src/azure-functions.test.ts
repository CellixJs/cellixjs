import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ApolloServer } from '@apollo/server';
import { HttpRequest, InvocationContext } from '@azure/functions-v4';
import { startServerAndCreateHandler } from './azure-functions.js';

// Mock Apollo Server
const mockApolloServer = {
  startInBackgroundHandlingStartupErrorsByLoggingAndFailingAllRequests: vi.fn(),
  executeHTTPGraphQLRequest: vi.fn(),
} as unknown as ApolloServer;

// Mock HttpRequest
const createMockRequest = (overrides: Partial<HttpRequest> = {}): HttpRequest => ({
  method: 'POST',
  url: 'https://example.com/graphql',
  headers: new Map([
    ['content-type', 'application/json'],
    ['authorization', 'Bearer token123'],
  ]),
  json: vi.fn().mockResolvedValue({ query: '{ hello }' }),
  ...overrides,
} as unknown as HttpRequest);

// Mock InvocationContext
const createMockContext = (): InvocationContext => ({
  invocationId: 'test-invocation',
  functionName: 'GraphQL',
  extraInputs: new Map(),
  extraOutputs: new Map(),
  retryContext: { retrycount: 0, maxRetryCount: 0 },
  traceContext: { traceparent: '', tracestate: '' },
  triggerMetadata: {},
  options: {},
  log: vi.fn(),
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
} as unknown as InvocationContext);

describe('azure-functions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('startServerAndCreateHandler', () => {
    it('should create an HTTP handler that starts Apollo Server in background', () => {
      const handler = startServerAndCreateHandler(mockApolloServer);
      
      expect(mockApolloServer.startInBackgroundHandlingStartupErrorsByLoggingAndFailingAllRequests).toHaveBeenCalledOnce();
      expect(handler).toBeTypeOf('function');
    });

    it('should handle successful GraphQL requests', async () => {
      const mockExecuteResult = {
        body: { kind: 'complete', string: '{"data":{"hello":"world"}}' },
        headers: new Map([['content-type', 'application/json']]),
        status: 200,
      };

      vi.mocked(mockApolloServer.executeHTTPGraphQLRequest).mockResolvedValue(mockExecuteResult);

      const handler = startServerAndCreateHandler(mockApolloServer);
      const request = createMockRequest();
      const context = createMockContext();

      const result = await handler(request, context);

      expect(result).toEqual({
        status: 200,
        headers: {
          'content-type': 'application/json',
          'content-length': '26',
        },
        body: '{"data":{"hello":"world"}}',
      });
    });

    it('should handle chunked responses with 501 error', async () => {
      const mockExecuteResult = {
        body: { kind: 'chunked' },
        headers: new Map(),
        status: 200,
      };

      vi.mocked(mockApolloServer.executeHTTPGraphQLRequest).mockResolvedValue(mockExecuteResult);

      const handler = startServerAndCreateHandler(mockApolloServer);
      const request = createMockRequest();
      const context = createMockContext();

      const result = await handler(request, context);

      expect(result).toEqual({
        status: 501,
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          errors: [
            {
              message: 'Incremental delivery (chunked responses) is not implemented.',
            },
          ],
        }),
      });
    });

    it('should handle GET requests with query parameters', async () => {
      const mockExecuteResult = {
        body: { kind: 'complete', string: '{"data":{"hello":"world"}}' },
        headers: new Map(),
        status: 200,
      };

      vi.mocked(mockApolloServer.executeHTTPGraphQLRequest).mockResolvedValue(mockExecuteResult);

      const handler = startServerAndCreateHandler(mockApolloServer);
      const request = createMockRequest({
        method: 'GET',
        url: 'https://example.com/graphql?query={hello}',
        json: vi.fn().mockResolvedValue(null),
      });
      const context = createMockContext();

      const result = await handler(request, context);

      expect(result.status).toBe(200);
      expect(mockApolloServer.executeHTTPGraphQLRequest).toHaveBeenCalledWith({
        httpGraphQLRequest: {
          method: 'GET',
          headers: expect.any(Object),
          search: '?query={hello}',
          body: null,
        },
        context: expect.any(Function),
      });
    });

    it('should handle requests without content-type for non-POST', async () => {
      const mockExecuteResult = {
        body: { kind: 'complete', string: '{"data":{"hello":"world"}}' },
        headers: new Map(),
        status: 200,
      };

      vi.mocked(mockApolloServer.executeHTTPGraphQLRequest).mockResolvedValue(mockExecuteResult);

      const handler = startServerAndCreateHandler(mockApolloServer);
      const request = createMockRequest({
        method: 'GET',
        headers: new Map(),
        json: vi.fn().mockResolvedValue(null),
      });
      const context = createMockContext();

      const result = await handler(request, context);

      expect(result.status).toBe(200);
    });

    it('should handle context function with custom context', async () => {
      const mockExecuteResult = {
        body: { kind: 'complete', string: '{"data":{"hello":"world"}}' },
        headers: new Map(),
        status: 200,
      };

      // Mock the Apollo Server executeHTTPGraphQLRequest to capture the context function
      let capturedContextFunction: any = null;
      vi.mocked(mockApolloServer.executeHTTPGraphQLRequest).mockImplementation(async ({ context }) => {
        capturedContextFunction = context;
        return mockExecuteResult;
      });

      const customContext = vi.fn().mockResolvedValue({ userId: '123' });
      const handler = startServerAndCreateHandler(mockApolloServer, {
        context: customContext,
      });

      const request = createMockRequest();
      const context = createMockContext();

      await handler(request, context);

      // Call the captured context function to verify it calls our custom context
      expect(capturedContextFunction).toBeDefined();
      await capturedContextFunction();
      expect(customContext).toHaveBeenCalledWith({ context, req: request });
    });

    it('should handle errors during GraphQL execution', async () => {
      const error = new Error('GraphQL execution failed');
      vi.mocked(mockApolloServer.executeHTTPGraphQLRequest).mockRejectedValue(error);

      const handler = startServerAndCreateHandler(mockApolloServer);
      const request = createMockRequest();
      const context = createMockContext();

      const result = await handler(request, context);

      expect(result).toEqual({
        status: 400,
        body: 'GraphQL execution failed',
      });
      expect(context.error).toHaveBeenCalledWith('Failure processing GraphQL request', error);
    });

    it('should handle requests without method', async () => {
      const handler = startServerAndCreateHandler(mockApolloServer);
      const request = createMockRequest({ method: undefined });
      const context = createMockContext();

      const result = await handler(request, context);

      expect(result.status).toBe(400);
      expect(result.body).toBe('No method');
    });

    it('should normalize headers correctly', async () => {
      const mockExecuteResult = {
        body: { kind: 'complete', string: '{"data":{"hello":"world"}}' },
        headers: new Map(),
        status: 200,
      };

      vi.mocked(mockApolloServer.executeHTTPGraphQLRequest).mockResolvedValue(mockExecuteResult);

      const handler = startServerAndCreateHandler(mockApolloServer);
      const request = createMockRequest({
        headers: new Map([
          ['authorization', 'Bearer token123'],
          ['x-custom-header', 'custom-value'],
        ]),
      });
      const context = createMockContext();

      await handler(request, context);

      expect(mockApolloServer.executeHTTPGraphQLRequest).toHaveBeenCalledWith({
        httpGraphQLRequest: expect.objectContaining({
          headers: expect.objectContaining({
            get: expect.any(Function),
            set: expect.any(Function),
          }),
        }),
        context: expect.any(Function),
      });
    });
  });
});