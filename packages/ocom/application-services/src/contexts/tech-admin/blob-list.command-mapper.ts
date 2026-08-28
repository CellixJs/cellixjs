type BlobListQueryInput = {
	container: string;
	prefix?: string | null;
	continuationToken?: string | null;
	pageSize?: number | null;
	nameContains?: string | null;
	metadataKey?: string | null;
	metadataValue?: string | null;
	tagKey?: string | null;
	tagValue?: string | null;
};

type BlobListQueryCommand = {
	containerName: string;
	prefix?: string;
	continuationToken?: string;
	pageSize?: number;
	nameContains?: string;
	metadataKey?: string;
	metadataValue?: string;
	tagKey?: string;
	tagValue?: string;
};

function optionalString(value: string | null | undefined): string | undefined {
	const trimmed = value?.trim();
	return trimmed ? trimmed : undefined;
}

export function buildBlobListQueryCommand(input: BlobListQueryInput): BlobListQueryCommand {
	const containerName = input.container?.trim();
	if (!containerName) {
		throw new Error('container is required');
	}
	const pageSize = input.pageSize ?? undefined;
	if (pageSize !== undefined && (!Number.isInteger(pageSize) || pageSize < 1 || pageSize > 100)) {
		throw new Error('pageSize must be an integer between 1 and 100');
	}

	const command: BlobListQueryCommand = { containerName };
	const prefix = optionalString(input.prefix ?? undefined);
	const continuationToken = optionalString(input.continuationToken ?? undefined);
	const nameContains = optionalString(input.nameContains ?? undefined);
	const metadataKey = optionalString(input.metadataKey ?? undefined);
	const tagKey = optionalString(input.tagKey ?? undefined);
	if (prefix !== undefined) {
		command.prefix = prefix;
	}
	if (continuationToken !== undefined) {
		command.continuationToken = continuationToken;
	}
	if (pageSize !== undefined) {
		command.pageSize = pageSize;
	}
	if (nameContains !== undefined) {
		command.nameContains = nameContains;
	}
	if (metadataKey !== undefined) {
		command.metadataKey = metadataKey;
	}
	if (input.metadataValue !== null && input.metadataValue !== undefined) {
		command.metadataValue = input.metadataValue;
	}
	if (tagKey !== undefined) {
		command.tagKey = tagKey;
	}
	if (input.tagValue !== null && input.tagValue !== undefined) {
		command.tagValue = input.tagValue;
	}
	return command;
}
