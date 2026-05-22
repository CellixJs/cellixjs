import { z } from 'zod';
export const importRequestsQueue = {
    queueName: 'import-requests',
    schema: z.object({
        importId: z.string().uuid(),
        requestedBy: z.string(),
        fileUrl: z.string().url(),
    }),
    loggingTags: { domain: 'imports', type: 'request' },
};
//# sourceMappingURL=import-requests.js.map