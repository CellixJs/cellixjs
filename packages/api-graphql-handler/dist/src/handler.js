import { startServerAndCreateHandler } from "./azure-functions.js";
export const graphHandlerCreator = (applicationServicesFactory) => {
    // Get the Apollo Server service from the infrastructure context
    const infrastructureContext = applicationServicesFactory.getInfrastructureContext();
    const apolloServerService = infrastructureContext.apolloServerService;
    const functionOptions = {
        context: async ({ req }) => {
            const authHeader = req.headers.get('Authorization') ?? undefined;
            const hints = {
                memberId: req.headers.get('x-member-id') ?? undefined,
                communityId: req.headers.get('x-community-id') ?? undefined,
            };
            return Promise.resolve({
                applicationServices: await applicationServicesFactory.forRequest(authHeader, hints),
            });
        },
    };
    return startServerAndCreateHandler(apolloServerService.server, functionOptions);
};
//# sourceMappingURL=handler.js.map