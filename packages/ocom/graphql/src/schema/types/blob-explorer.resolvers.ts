import type { GraphQLResolveInfo } from 'graphql';
import type { QueryBlobExplorerGetDownloadAuthorizationArgs, QueryBlobExplorerListBlobsArgs, Resolvers } from '../builder/generated.ts';
import type { GraphContext } from '../context.ts';

const blobExplorer: Resolvers = {
	Query: {
		blobExplorerListContainers: async (_parent, _args, context: GraphContext, _info: GraphQLResolveInfo) => {
			if (!context.applicationServices.verifiedUser?.verifiedJwt) {
				throw new Error('Unauthorized');
			}

			const jwt = context.applicationServices.verifiedUser.verifiedJwt;
			const staffUser = await context.applicationServices.User.StaffUser.queryByExternalId({ externalId: jwt.sub });
			if (!staffUser?.role?.permissions?.techAdminPermissions?.canViewBlobExplorer) {
				throw new Error('Unauthorized');
			}

			const result = await context.applicationServices.TechAdmin.BlobExplorer.listContainers();
			return { containers: result.containers.map((c) => ({ name: c.name })) };
		},

		blobExplorerListBlobs: async (_parent, args: QueryBlobExplorerListBlobsArgs, context: GraphContext, _info: GraphQLResolveInfo) => {
			if (!context.applicationServices.verifiedUser?.verifiedJwt) {
				throw new Error('Unauthorized');
			}

			const jwt = context.applicationServices.verifiedUser.verifiedJwt;
			const staffUser = await context.applicationServices.User.StaffUser.queryByExternalId({ externalId: jwt.sub });
			if (!staffUser?.role?.permissions?.techAdminPermissions?.canViewBlobExplorer) {
				throw new Error('Unauthorized');
			}

			const { input } = args;
			const request = {
				containerName: input.containerName,
				...(input.prefix != null ? { prefix: input.prefix } : {}),
				...(input.continuationToken != null ? { continuationToken: input.continuationToken } : {}),
				...(input.maxResults != null ? { maxResults: input.maxResults } : {}),
				...(input.nameFilter != null ? { nameFilter: input.nameFilter } : {}),
				...(input.metadataFilter != null ? { metadataFilter: { key: input.metadataFilter.key, value: input.metadataFilter.value } } : {}),
				...(input.tagFilter != null ? { tagFilter: { key: input.tagFilter.key, value: input.tagFilter.value } } : {}),
			};
			const result = await context.applicationServices.TechAdmin.BlobExplorer.listBlobsHierarchy(request);
			return {
				items: result.items.map((item) => ({
					name: item.name,
					contentType: item.contentType ?? null,
					contentLength: item.contentLength ?? null,
					lastModified: item.lastModified ? item.lastModified.toISOString() : null,
					metadata: item.metadata ?? null,
					tags: item.tags ?? null,
				})),
				prefixes: result.prefixes,
				continuationToken: result.continuationToken ?? null,
			};
		},

		blobExplorerGetDownloadAuthorization: async (_parent, args: QueryBlobExplorerGetDownloadAuthorizationArgs, context: GraphContext, _info: GraphQLResolveInfo) => {
			if (!context.applicationServices.verifiedUser?.verifiedJwt) {
				throw new Error('Unauthorized');
			}

			const jwt = context.applicationServices.verifiedUser.verifiedJwt;
			const staffUser = await context.applicationServices.User.StaffUser.queryByExternalId({ externalId: jwt.sub });
			if (!staffUser?.role?.permissions?.techAdminPermissions?.canViewBlobExplorer) {
				throw new Error('Unauthorized');
			}

			const { input } = args;
			return await context.applicationServices.TechAdmin.BlobExplorer.getBlobDownloadAuthorization({
				containerName: input.containerName,
				blobName: input.blobName,
				contentLength: input.contentLength,
				contentType: input.contentType,
			});
		},
	},
};

export default blobExplorer;
