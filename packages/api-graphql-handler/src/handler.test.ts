import { describe, it, expect, vi } from 'vitest';
import { graphHandlerCreator } from './handler.js';
import type { ApplicationServicesFactory } from '@ocom/api-application-services';
import type { GraphContext } from '@ocom/api-graphql';

// Mock dependencies
const mockApolloServer = {
  server: {
    startInBackgroundHandlingStartupErrorsByLoggingAndFailingAllRequests: vi.fn(),
    executeHTTPGraphQLRequest: vi.fn(),
  },
};

const mockInfrastructureContext = {
  apolloServerService: mockApolloServer,
};

const mockApplicationServicesFactory = {
  getInfrastructureContext: vi.fn().mockReturnValue(mockInfrastructureContext),
  forRequest: vi.fn().mockResolvedValue({ userId: '123' }),
} as unknown as ApplicationServicesFactory<GraphContext>;

// Mock the startServerAndCreateHandler function
vi.mock('./azure-functions.js', () => ({
  startServerAndCreateHandler: vi.fn((_server, _options) => {
    // Return a mock handler function
    return vi.fn().mockResolvedValue({
      status: 200,
      body: '{"data":{"hello":"world"}}',
    });
  }),
}));

import { startServerAndCreateHandler } from './azure-functions.js';

describe('handler', () => {
  describe('graphHandlerCreator', () => {
    it('should create a GraphQL handler using Apollo Server service', () => {
      const handler = graphHandlerCreator(mockApplicationServicesFactory);

      expect(mockApplicationServicesFactory.getInfrastructureContext).toHaveBeenCalledOnce();
      expect(startServerAndCreateHandler).toHaveBeenCalledWith(
        mockApolloServer.server,
        expect.objectContaining({
          context: expect.any(Function),
        }),
      );
      expect(handler).toBeTypeOf('function');
    });

    it('should create context function that extracts headers and calls forRequest', async () => {
      graphHandlerCreator(mockApplicationServicesFactory);

      // Get the context function passed to startServerAndCreateHandler
      const contextFunction = vi.mocked(startServerAndCreateHandler).mock.calls[0][1]?.context;
      expect(contextFunction).toBeDefined();

      // Mock request with headers
      const mockReq = {
        headers: new Map([
          ['Authorization', 'Bearer token123'],
          ['x-member-id', 'member123'],
          ['x-community-id', 'community456'],
        ]),
      };

      const result = await contextFunction?.({ req: mockReq, context: {} } as unknown);

      expect(mockApplicationServicesFactory.forRequest).toHaveBeenCalledWith(
        'Bearer token123',
        {
          memberId: 'member123',
          communityId: 'community456',
        },
      );

      expect(result).toEqual({
        applicationServices: { userId: '123' },
      });
    });

    it('should handle missing authorization header', async () => {
      vi.clearAllMocks();
      graphHandlerCreator(mockApplicationServicesFactory);

      const contextFunction = vi.mocked(startServerAndCreateHandler).mock.calls[0][1]?.context;
      const mockReq = {
        headers: new Map([
          ['x-member-id', 'member123'],
        ]),
      };

      await contextFunction?.({ req: mockReq, context: {} } as unknown);

      expect(mockApplicationServicesFactory.forRequest).toHaveBeenCalledWith(
        undefined,
        {
          memberId: 'member123',
          communityId: undefined,
        },
      );
    });

    it('should handle missing hint headers', async () => {
      vi.clearAllMocks();
      graphHandlerCreator(mockApplicationServicesFactory);

      const contextFunction = vi.mocked(startServerAndCreateHandler).mock.calls[0][1]?.context;
      const mockReq = {
        headers: new Map([
          ['Authorization', 'Bearer token123'],
        ]),
      };

      await contextFunction?.({ req: mockReq, context: {} } as unknown);

      expect(mockApplicationServicesFactory.forRequest).toHaveBeenCalledWith(
        'Bearer token123',
        {
          memberId: undefined,
          communityId: undefined,
        },
      );
    });
  });
});