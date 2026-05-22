export class BlobQueueMessageLogger {
    blobStorage;
    containerName;
    constructor(blobStorage, containerName) {
        this.blobStorage = blobStorage;
        this.containerName = containerName;
    }
    async logMessage(envelope) {
        const name = `${envelope.queue}/${envelope.messageId ?? Date.now().toString()}.json`;
        const text = JSON.stringify({ envelope }, null, 2);
        await this.blobStorage.uploadText({ containerName: this.containerName, blobName: name, text });
        return { container: this.containerName, blobName: name, url: `${this.containerName}/${name}` };
    }
}
//# sourceMappingURL=logging.js.map