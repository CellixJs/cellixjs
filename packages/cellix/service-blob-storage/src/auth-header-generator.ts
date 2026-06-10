import { createHmac } from 'node:crypto';
import { HeaderConstants } from './auth-header-constants.js';

/**
 * Generates SharedKey authorization headers for Azure Blob Storage requests.
 * Reference: https://learn.microsoft.com/en-us/rest/api/storageservices/authorize-with-shared-key
 */
export class AuthHeaderGenerator {
	/**
	 * Generate a SharedKey authorization header for a request.
	 * @param headers Record of headers for the request (will be modified to include x-ms-date)
	 * @param accountName Storage account name
	 * @param accountKey Base64-encoded storage account key
	 * @param method HTTP method (PUT, GET, etc.)
	 * @param url Full URL to the blob resource
	 * @returns Complete authorization header value in format "SharedKey accountName:signature".
	 *          Client can use this directly as the Authorization header value.
	 */
	public generateAuthorizationHeader(headers: Record<string, string>, accountName: string, accountKey: string, method: string, url: string): string {
		// Set current date if not already set
		if (!headers[HeaderConstants.X_MS_DATE]) {
			headers[HeaderConstants.X_MS_DATE] = new Date().toUTCString();
		}

		const signableString = this.buildSignableString(headers, accountName, method, url);
		const signature = this.computeHMACSHA256(signableString, accountKey);

		return `SharedKey ${accountName}:${signature}`;
	}

	/**
	 * Build the canonical string to sign following Azure Blob Storage conventions.
	 * https://learn.microsoft.com/en-us/rest/api/storageservices/authorize-with-shared-key#blob-service
	 */
	private buildSignableString(headers: Record<string, string>, accountName: string, method: string, url: string): string {
		// Order of headers matters for signature computation
		const contentEncoding = headers[HeaderConstants.CONTENT_ENCODING] || '';
		const contentLanguage = headers[HeaderConstants.CONTENT_LANGUAGE] || '';
		const contentLength = headers[HeaderConstants.CONTENT_LENGTH] || '';
		const contentMD5 = headers[HeaderConstants.CONTENT_MD5] || '';
		const contentType = headers[HeaderConstants.CONTENT_TYPE] || '';
		const date = headers[HeaderConstants.DATE] || '';
		const ifModifiedSince = headers[HeaderConstants.IF_MODIFIED_SINCE] || '';
		const ifMatch = headers[HeaderConstants.IF_MATCH] || '';
		const ifNoneMatch = headers[HeaderConstants.IF_NONE_MATCH] || '';
		const ifUnmodifiedSince = headers[HeaderConstants.IF_UNMODIFIED_SINCE] || '';
		const range = headers[HeaderConstants.RANGE] || '';

		// Blob-specific: ContentLength of 0 should be empty string in signable string
		const contentLengthForSign = contentLength === '0' ? '' : contentLength;

		const canonicalizedHeaders = this.getCanonicalizedHeadersString(headers);
		const canonicalizedResource = this.getCanonicalizedResourceString(accountName, url);

		return (
			`${method}\n${contentEncoding}\n${contentLanguage}\n${contentLengthForSign}\n${contentMD5}\n${contentType}\n${date}\n${ifModifiedSince}\n${ifMatch}\n${ifNoneMatch}\n${ifUnmodifiedSince}\n${range}\n` +
			canonicalizedHeaders +
			canonicalizedResource
		);
	}

	/**
	 * Extract and canonicalize x-ms-* headers.
	 * Rules:
	 * 1. Retrieve all headers starting with x-ms-
	 * 2. Convert to lowercase
	 * 3. Sort lexicographically
	 * 4. Remove duplicates
	 * 5. Trim whitespace around colon
	 * 6. Append newline to each
	 */
	private getCanonicalizedHeadersString(headers: Record<string, string>): string {
		const xmsHeaders: Array<[string, string]> = [];

		for (const [key, value] of Object.entries(headers)) {
			if (key.toLowerCase().startsWith(HeaderConstants.PREFIX_FOR_STORAGE)) {
				xmsHeaders.push([key.toLowerCase(), value]);
			}
		}

		// Sort lexicographically
		xmsHeaders.sort((a, b) => a[0].localeCompare(b[0]));

		// Remove duplicates (keep first occurrence)
		const unique: Array<[string, string]> = [];
		for (const header of xmsHeaders) {
			if (!unique.some((h) => h[0] === header[0])) {
				unique.push(header);
			}
		}

		// Format as "name:value\n"
		return unique.map(([name, value]) => `${name.trimEnd()}:${value.trimStart()}\n`).join('');
	}

	/**
	 * Extract and canonicalize the resource path.
	 * Format: /{accountName}/{container}/{blob}
	 */
	private getCanonicalizedResourceString(accountName: string, url: string): string {
		const parsedUrl = new URL(url);
		const path = parsedUrl.pathname || '/';

		let canonicalizedResource = `/${accountName}${path}`;

		// Add query parameters if present, sorted and formatted as name:value
		const { searchParams } = parsedUrl;
		if (searchParams.size > 0) {
			const keys = Array.from(searchParams.keys()).sort((a, b) => a.localeCompare(b));
			for (const key of keys) {
				canonicalizedResource += `\n${key.toLowerCase()}:${searchParams.get(key)}`;
			}
		}

		return canonicalizedResource;
	}

	/**
	 * Compute HMAC-SHA256 signature.
	 */
	private computeHMACSHA256(stringToSign: string, accountKey: string): string {
		const decodedKey = Buffer.from(accountKey, 'base64');
		return createHmac('sha256', decodedKey).update(stringToSign).digest('base64');
	}
}
