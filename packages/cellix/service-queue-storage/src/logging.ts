export type MessageLogEnvelope = {
	queue: string;
	messageId?: string;
	payload: unknown;
	metadata?: Record<string, unknown>;
	createdAt?: string;
};

export type LogAddress = { container: string; blobName: string; url?: string };

export interface IQueueMessageLogger {
	logMessage(envelope: MessageLogEnvelope): Promise<LogAddress>;
}

type BlobStorageLike = {
	uploadText(request: { containerName: string; blobName: string; text: string }): Promise<unknown>;
};

export class BlobQueueMessageLogger implements IQueueMessageLogger {
	private readonly blobStorage: BlobStorageLike;
	private readonly containerName: string;
	constructor(blobStorage: BlobStorageLike, containerName: string) {
		this.blobStorage = blobStorage;
		this.containerName = containerName;
	}

	public async logMessage(envelope: MessageLogEnvelope): Promise<LogAddress> {
		const name = `${envelope.queue}/${envelope.messageId ?? Date.now().toString()}.json`;
		const text = JSON.stringify({ envelope }, null, 2);
		await this.blobStorage.uploadText({ containerName: this.containerName, blobName: name, text });
		return { container: this.containerName, blobName: name, url: `${this.containerName}/${name}` };
	}
}
