import type { BlobAddress, BlobStorageOperations, ClientUploadOperations } from '@ocom/service-blob-storage';

type BlobContentQueryCommand = BlobAddress;

type BlobContentResult = {
	blobName: string;
	contentType?: string;
	contentLength: number;
	lastModified?: string;
	metadata: Record<string, string>;
	tags: Record<string, string>;
	contentBase64: string;
	encoding?: 'utf-8' | 'binary';
	downloadUrl?: string;
};

export const GetBlobContent = (blobStorageService: BlobStorageOperations, clientOperationsService?: ClientUploadOperations) => {
	return async (command: BlobContentQueryCommand): Promise<BlobContentResult> => {
		if (!command.containerName?.trim()) {
			throw new Error('containerName is required');
		}
		if (!command.blobName?.trim()) {
			throw new Error('blobName is required');
		}

		const downloaded = await blobStorageService.downloadBlob(command);
		const contentBase64 = Buffer.from(downloaded.content).toString('base64');

		let downloadUrl = downloaded.url;
		if (clientOperationsService) {
			const expiresOn = new Date(Date.now() + 5 * 60 * 1000);
			const sas = await clientOperationsService.generateReadSasToken({
				containerName: command.containerName,
				blobName: command.blobName,
				expiresOn,
			});
			downloadUrl = `${downloaded.url}${downloaded.url.includes('?') ? '&' : '?'}${sas}`;
		}

		const result: BlobContentResult = {
			blobName: command.blobName,
			contentLength: downloaded.contentLength,
			metadata: downloaded.metadata,
			tags: downloaded.tags,
			contentBase64,
			downloadUrl,
		};
		if (downloaded.contentType !== undefined) {
			result.contentType = downloaded.contentType;
		}
		if (downloaded.lastModified !== undefined) {
			result.lastModified = downloaded.lastModified.toISOString();
		}
		if (downloaded.encoding !== undefined) {
			result.encoding = downloaded.encoding;
		}
		return result;
	};
};
