/**
 * Application-specific resolver builder using @celllix/graphql-core
 */
import { createResolverBuilders } from '@celllix/graphql-core';
import type { Resolvers } from './generated.ts';

// Create resolver builders for this application
const { resolvers: appResolvers, permissions: appPermissions } = createResolverBuilders();

export const resolvers: Resolvers = appResolvers;
export const permissions: Resolvers = appPermissions;