/** A video a staff member can encode now. */
export interface VideoAwaitingEncoding {
	id: string;
	title: string;
	status: 'UPLOADED' | 'ENCODING' | 'FAILED';
	communityId: string;
	communityName: string | null;
	sourceSizeBytes: number;
	failureMessage: string | null;
	createdAt: string;
}

/** What the API returns when encoding starts. */
export interface EncodingStart {
	/** Read link for the original, valid for a few hours. */
	sourceUrl: string;
	outputContainerName: string;
	outputPrefix: string;
}

/** A write link for one encoded output file. */
export interface OutputUploadLink {
	path: string;
	url: string;
}

/** A successful encode, with manifest paths relative to the output prefix. */
export interface EncodingSuccessReport {
	dashManifestPath: string;
	hlsManifestPath: string;
	durationSeconds: number;
	renditionHeights: number[];
}

/** Error from the API: a GraphQL error, a failed mutation, or an HTTP failure. */
export class EncoderApiError extends Error {
	public readonly status: number | undefined;

	constructor(message: string, status?: number) {
		super(message);
		this.name = 'EncoderApiError';
		this.status = status;
	}
}

export interface EncoderApiClientOptions {
	/** GraphQL endpoint, for example `https://data-access.ownercommunity.localhost:1355/api/graphql`. */
	apiUrl: string;
	/** Returns a staff access token for the `Authorization` header. */
	getAccessToken: () => Promise<string>;
	fetch?: typeof fetch;
}

/** The staff encoding operations of the OwnerCommunity API (ADR 0036). */
export interface EncoderApiClient {
	/** Ensures the signed-in staff user exists, creating it on first sign-in like the staff portal does. */
	ensureStaffUser(): Promise<{ id: string; displayName: string }>;
	listAwaitingEncoding(): Promise<VideoAwaitingEncoding[]>;
	startEncoding(videoId: string): Promise<EncodingStart>;
	requestOutputUploads(videoId: string, paths: readonly string[]): Promise<OutputUploadLink[]>;
	recordSucceeded(videoId: string, report: EncodingSuccessReport): Promise<void>;
	recordFailed(videoId: string, failure: { code: string; message: string }): Promise<void>;
}

interface MutationStatus {
	status: { success: boolean; errorMessage: string | null };
}

export function createEncoderApiClient(options: EncoderApiClientOptions): EncoderApiClient {
	const fetchImpl = options.fetch ?? fetch;

	const request = async <T>(query: string, variables: Record<string, unknown> = {}): Promise<T> => {
		const response = await fetchImpl(options.apiUrl, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${await options.getAccessToken()}` },
			body: JSON.stringify({ query, variables }),
		});
		if (!response.ok) {
			throw new EncoderApiError(`API request failed with HTTP ${response.status}`, response.status);
		}
		const body = (await response.json()) as { data?: T; errors?: { message: string }[] };
		if (body.errors?.length) {
			throw new EncoderApiError(body.errors.map((error) => error.message).join('; '));
		}
		if (!body.data) {
			throw new EncoderApiError('API response had no data');
		}
		return body.data;
	};

	const mutate = async <K extends string, T extends MutationStatus>(field: K, query: string, variables: Record<string, unknown>): Promise<T> => {
		const data = await request<Record<K, T>>(query, variables);
		const result = data[field];
		if (!result.status.success) {
			throw new EncoderApiError(result.status.errorMessage ?? `${field} failed`);
		}
		return result;
	};

	return {
		async ensureStaffUser() {
			const data = await request<{ currentStaffUserAndCreateIfNotExists: { id: string; displayName: string } }>('query EncoderCurrentStaffUser { currentStaffUserAndCreateIfNotExists { id displayName } }');
			return data.currentStaffUserAndCreateIfNotExists;
		},

		async listAwaitingEncoding() {
			const data = await request<{ videosAwaitingEncoding: VideoAwaitingEncoding[] }>(
				'query EncoderVideosAwaitingEncoding { videosAwaitingEncoding { id title status communityId communityName sourceSizeBytes failureMessage createdAt } }',
			);
			return data.videosAwaitingEncoding;
		},

		async startEncoding(videoId) {
			const result = await mutate<'videoStartEncoding', MutationStatus & { encoding: EncodingStart | null }>(
				'videoStartEncoding',
				'mutation EncoderStartEncoding($input: VideoStartEncodingInput!) { videoStartEncoding(input: $input) { status { success errorMessage } encoding { sourceUrl outputContainerName outputPrefix } } }',
				{ input: { id: videoId } },
			);
			if (!result.encoding) {
				throw new EncoderApiError('videoStartEncoding returned no encoding details');
			}
			return result.encoding;
		},

		async requestOutputUploads(videoId, paths) {
			const result = await mutate<'videoRequestOutputUploads', MutationStatus & { uploads: OutputUploadLink[] | null }>(
				'videoRequestOutputUploads',
				'mutation EncoderRequestOutputUploads($input: VideoRequestOutputUploadsInput!) { videoRequestOutputUploads(input: $input) { status { success errorMessage } uploads { path url } } }',
				{ input: { id: videoId, paths } },
			);
			return result.uploads ?? [];
		},

		async recordSucceeded(videoId, report) {
			await mutate('videoRecordEncodingResult', RECORD_RESULT, { input: { id: videoId, succeeded: report } });
		},

		async recordFailed(videoId, failure) {
			await mutate('videoRecordEncodingResult', RECORD_RESULT, { input: { id: videoId, failed: failure } });
		},
	};
}

const RECORD_RESULT = 'mutation EncoderRecordEncodingResult($input: VideoRecordEncodingResultInput!) { videoRecordEncodingResult(input: $input) { status { success errorMessage } } }';
