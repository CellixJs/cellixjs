/**
 * Header constants for Azure Blob Storage SharedKey authorization.
 * Reference: https://learn.microsoft.com/en-us/rest/api/storageservices/authorize-with-shared-key
 */
export const HeaderConstants = {
	AUTHORIZATION: 'Authorization',
	CONTENT_ENCODING: 'Content-Encoding',
	CONTENT_LANGUAGE: 'Content-Language',
	CONTENT_LENGTH: 'Content-Length',
	CONTENT_MD5: 'Content-Md5',
	CONTENT_TYPE: 'Content-Type',
	DATE: 'Date',
	IF_MATCH: 'If-Match',
	IF_MODIFIED_SINCE: 'If-Modified-Since',
	IF_NONE_MATCH: 'If-None-Match',
	IF_UNMODIFIED_SINCE: 'If-Unmodified-Since',
	RANGE: 'Range',
	PREFIX_FOR_STORAGE: 'x-ms-',
	X_MS_BLOB_TYPE: 'x-ms-blob-type',
	X_MS_DATE: 'x-ms-date',
	X_MS_VERSION: 'x-ms-version',
	X_MS_META: 'x-ms-meta-',
};
