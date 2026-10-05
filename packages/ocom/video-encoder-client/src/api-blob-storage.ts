import { createWriteStream } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import type { ReadableStream as WebReadableStream } from 'node:stream/web';
import type { ServiceVideoEncodingOptions } from '@ocom/service-video-encoding';
import type { EncoderApiClient } from './api-client.ts';

type BlobTransfers = ServiceVideoEncodingOptions['blobStorage'];

export interface ApiBlobStorageOptions {
	api: Pick<EncoderApiClient, 'requestOutputUploads'>;
	videoId: string;
	/** Read link for the original, from `startEncoding`. */
	sourceUrl: string;
	/** Output prefix from `startEncoding`; every uploaded blob name must start with it. */
	outputPrefix: string;
	fetch?: typeof fetch;
	/** Most paths per upload-link request. Defaults to 200. */
	batchSize?: number;
	/** How long to collect upload requests before asking for links. Defaults to 25 ms. */
	batchDelayMs?: number;
}

/** Error carrying the HTTP status of a failed storage request, so the encoder can classify it. */
class StorageRequestError extends Error {
	public readonly statusCode: number;

	constructor(message: string, statusCode: number) {
		super(message);
		this.name = 'StorageRequestError';
		this.statusCode = statusCode;
	}
}

/**
 * The blob operations `ServiceVideoEncoding` needs, backed by links issued by
 * the API instead of storage credentials: the original is downloaded with its
 * read link, and each output file is uploaded with a write link requested for
 * exactly that file. Upload-link requests are batched, since one encode writes
 * hundreds of files.
 */
export function createApiBlobStorage(options: ApiBlobStorageOptions): BlobTransfers {
	const fetchImpl = options.fetch ?? fetch;
	const batchSize = options.batchSize ?? 200;
	const batchDelayMs = options.batchDelayMs ?? 25;
	let pending: { path: string; resolve: (url: string) => void; reject: (error: unknown) => void }[] = [];
	let timer: NodeJS.Timeout | undefined;

	const flush = () => {
		if (timer) {
			clearTimeout(timer);
			timer = undefined;
		}
		const batch = pending;
		pending = [];
		if (batch.length === 0) {
			return;
		}
		options.api.requestOutputUploads(options.videoId, [...new Set(batch.map((entry) => entry.path))]).then(
			(links) => {
				const urls = new Map(links.map((link) => [link.path, link.url]));
				for (const entry of batch) {
					const url = urls.get(entry.path);
					if (url) {
						entry.resolve(url);
					} else {
						entry.reject(new Error(`The API returned no upload link for ${entry.path}`));
					}
				}
			},
			(error: unknown) => {
				for (const entry of batch) entry.reject(error);
			},
		);
	};

	const uploadLinkFor = (path: string) =>
		new Promise<string>((resolve, reject) => {
			pending.push({ path, resolve, reject });
			if (pending.length >= batchSize) {
				flush();
			} else {
				timer ??= setTimeout(flush, batchDelayMs);
			}
		});

	return {
		async downloadToFile(request) {
			const response = await fetchImpl(options.sourceUrl, request.abortSignal ? { signal: request.abortSignal } : {});
			if (!response.ok || !response.body) {
				throw new StorageRequestError(`Downloading the original failed with HTTP ${response.status}`, response.status);
			}
			await pipeline(Readable.fromWeb(response.body as WebReadableStream<Uint8Array>), createWriteStream(request.filePath));
		},

		async uploadFile(request) {
			if (!request.blobName.startsWith(options.outputPrefix)) {
				throw new Error(`Refusing to upload ${request.blobName} outside the output prefix ${options.outputPrefix}`);
			}
			const url = await uploadLinkFor(request.blobName.slice(options.outputPrefix.length));
			const body = await readFile(request.filePath);
			const response = await fetchImpl(url, {
				method: 'PUT',
				headers: { 'x-ms-blob-type': 'BlockBlob', 'Content-Type': request.httpHeaders?.blobContentType ?? 'application/octet-stream' },
				body,
				...(request.abortSignal ? { signal: request.abortSignal } : {}),
			});
			if (!response.ok) {
				throw new StorageRequestError(`Uploading ${request.blobName} failed with HTTP ${response.status}`, response.status);
			}
			return {} as Awaited<ReturnType<BlobTransfers['uploadFile']>>;
		},
	};
}
