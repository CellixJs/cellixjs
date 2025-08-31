import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock dependencies before importing
vi.mock('@graphql-tools/load-files', () => ({
  loadFilesSync: vi.fn(),
}));

vi.mock('@graphql-tools/merge', () => ({
  mergeResolvers: vi.fn(),
}));

import { createResolverBuilders } from './resolver-builder.js';
import { loadFilesSync } from '@graphql-tools/load-files';
import { mergeResolvers } from '@graphql-tools/merge';

describe('resolver-builder', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createResolverBuilders', () => {
    it('should create resolver builders with default paths', () => {
      const mockResolvers = [{ Query: { hello: () => 'Hello' } }];
      const mockPermissions = [{ Query: { hello: () => true } }];
      const mergedResolvers = { Query: { hello: () => 'Hello' } };
      const mergedPermissions = { Query: { hello: () => true } };

      vi.mocked(loadFilesSync)
        .mockReturnValueOnce(mockResolvers)
        .mockReturnValueOnce(mockPermissions);

      vi.mocked(mergeResolvers)
        .mockReturnValueOnce(mergedResolvers)
        .mockReturnValueOnce(mergedPermissions);

      const result = createResolverBuilders();

      expect(result).toEqual({
        resolvers: mergedResolvers,
        permissions: mergedPermissions,
      });

      expect(loadFilesSync).toHaveBeenCalledTimes(2);
      expect(mergeResolvers).toHaveBeenCalledTimes(2);
      expect(mergeResolvers).toHaveBeenNthCalledWith(1, mockResolvers);
      expect(mergeResolvers).toHaveBeenNthCalledWith(2, mockPermissions);
    });

    it('should use custom application root path when provided', () => {
      const customPath = '/custom/app/path';
      const mockResolvers = [{ Query: { test: () => 'test' } }];
      const mockPermissions = [{ Query: { test: () => true } }];

      vi.mocked(loadFilesSync)
        .mockReturnValueOnce(mockResolvers)
        .mockReturnValueOnce(mockPermissions);

      vi.mocked(mergeResolvers)
        .mockReturnValueOnce({})
        .mockReturnValueOnce({});

      createResolverBuilders(customPath);

      expect(loadFilesSync).toHaveBeenNthCalledWith(
        1,
        `${customPath}/dist/src/schema/types/**/*.resolvers.{js,cjs,mjs}`
      );
      expect(loadFilesSync).toHaveBeenNthCalledWith(
        2,
        `${customPath}/dist/src/schema/types/**/*.permissions.{js,cjs,mjs}`
      );
    });

    it('should handle empty resolver arrays', () => {
      vi.mocked(loadFilesSync)
        .mockReturnValueOnce([])
        .mockReturnValueOnce([]);

      vi.mocked(mergeResolvers)
        .mockReturnValueOnce({})
        .mockReturnValueOnce({});

      const result = createResolverBuilders();

      expect(result).toEqual({
        resolvers: {},
        permissions: {},
      });

      expect(mergeResolvers).toHaveBeenNthCalledWith(1, []);
      expect(mergeResolvers).toHaveBeenNthCalledWith(2, []);
    });

    it('should correctly construct glob patterns', () => {
      vi.mocked(loadFilesSync)
        .mockReturnValueOnce([])
        .mockReturnValueOnce([]);

      vi.mocked(mergeResolvers)
        .mockReturnValueOnce({})
        .mockReturnValueOnce({});

      createResolverBuilders();

      // Check that the glob patterns are constructed correctly
      const resolversCallArg = vi.mocked(loadFilesSync).mock.calls[0][0];
      const permissionsCallArg = vi.mocked(loadFilesSync).mock.calls[1][0];

      expect(resolversCallArg).toMatch(/dist\/src\/schema\/types\/\*\*\/\*\.resolvers\.{js,cjs,mjs}$/);
      expect(permissionsCallArg).toMatch(/dist\/src\/schema\/types\/\*\*\/\*\.permissions\.{js,cjs,mjs}$/);
    });
  });
});