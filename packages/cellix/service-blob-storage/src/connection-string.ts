const getConnectionStringValue = (connectionString: string, key: string): string | undefined => {
	const segments = connectionString.split(';');
	const targetKey = key.trim().toLowerCase();
	for (const rawSegment of segments) {
		if (!rawSegment) {
			continue; // skip empty segments
		}
		const idx = rawSegment.indexOf('=');
		if (idx === -1) {
			continue; // skip malformed segment
		}
		const segmentKey = rawSegment.substring(0, idx).trim();
		const value = rawSegment.substring(idx + 1).trim();
		if (segmentKey.toLowerCase() === targetKey) {
			return value;
		}
	}
	return undefined;
};

const validateSigningConnectionString = (connectionString: string | undefined): { accountName: string; accountKey: string } => {
	if (typeof connectionString !== 'string' || !connectionString.trim()) {
		throw new Error("'signingConnectionString' must be a non-empty string");
	}

	const accountName = getConnectionStringValue(connectionString, 'AccountName');
	const accountKey = getConnectionStringValue(connectionString, 'AccountKey');
	if (!accountName || !accountKey) {
		throw new Error('signingConnectionString must include both AccountName and AccountKey');
	}

	return { accountName, accountKey };
};

const isLocalBlobConnectionString = (connectionString: string | undefined): boolean => {
	if (typeof connectionString !== 'string' || !connectionString.trim()) {
		return false;
	}

	if (/usedevelopmentstorage=true/i.test(connectionString)) {
		return true;
	}

	const blobEndpoint = getConnectionStringValue(connectionString, 'BlobEndpoint');
	if (!blobEndpoint) {
		return false;
	}

	try {
		const url = new URL(blobEndpoint);
		return url.hostname === 'localhost' || url.hostname === '127.0.0.1' || url.hostname === '[::1]';
	} catch {
		return false;
	}
};

export { isLocalBlobConnectionString, validateSigningConnectionString };
