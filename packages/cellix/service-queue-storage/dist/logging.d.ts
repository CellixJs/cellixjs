export type MessageLogEnvelope = {
    queue: string;
    messageId?: string;
    payload: unknown;
    metadata?: Record<string, unknown>;
    createdAt?: string;
};
export type LogAddress = {
    container: string;
    blobName: string;
    url?: string;
};
export interface IQueueMessageLogger {
    logMessage(envelope: MessageLogEnvelope): Promise<LogAddress>;
}
type BlobStorageLike = {
    uploadText(request: {
        containerName: string;
        blobName: string;
        text: string;
    }): Promise<unknown>;
};
export declare class BlobQueueMessageLogger implements IQueueMessageLogger {
    private readonly blobStorage;
    private readonly containerName;
    constructor(blobStorage: BlobStorageLike, containerName: string);
    logMessage(envelope: MessageLogEnvelope): Promise<LogAddress>;
}
export {};
