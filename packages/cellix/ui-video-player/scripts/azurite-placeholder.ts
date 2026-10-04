import { ContainerSASPermissions, generateBlobSASQueryParameters, StorageSharedKeyCredential } from '@azure/storage-blob';
import { getAzuritePorts } from '@cellix/local-dev';

// Azurite's documented, publicly known development account. Never valid against real Azure Storage.
export const AZURITE_ACCOUNT_NAME = 'devstoreaccount1';
export const AZURITE_ACCOUNT_KEY = 'Eby8vdM02xNOcqFlqUwJPLlmEtlCDXJ1OUzFT50uSRZ6IFsuFq2UVErCz4I6tq/K1SZFPTOtr/KBHBeksoGMGw==';

export const PLACEHOLDER_CONTAINER = 'videos';
export const PLACEHOLDER_PREFIX = 'placeholder/';

/** Blob service endpoint for the active worktree's Azurite instance. */
export function getAzuriteBlobEndpoint(): string {
	return `http://127.0.0.1:${getAzuritePorts().blob}/${AZURITE_ACCOUNT_NAME}`;
}

export function getAzuriteCredential(): StorageSharedKeyCredential {
	return new StorageSharedKeyCredential(AZURITE_ACCOUNT_NAME, AZURITE_ACCOUNT_KEY);
}

export function getPlaceholderManifestUrl(): string {
	return `${getAzuriteBlobEndpoint()}/${PLACEHOLDER_CONTAINER}/${PLACEHOLDER_PREFIX}manifest.mpd`;
}

/** Read-only, container-scoped SAS for the placeholder container. */
export function createPlaceholderSasToken(expiresInHours = 24): string {
	return generateBlobSASQueryParameters(
		{
			containerName: PLACEHOLDER_CONTAINER,
			permissions: ContainerSASPermissions.parse('r'),
			startsOn: new Date(Date.now() - 5 * 60 * 1000),
			expiresOn: new Date(Date.now() + expiresInHours * 60 * 60 * 1000),
		},
		getAzuriteCredential(),
	).toString();
}
