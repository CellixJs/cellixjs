import { describe, expect, it } from 'vitest';

// Sanity test: package-level re-exports should include ServiceBlobStorage
import { ServiceBlobStorage } from './index.js';

describe('packages/ocom/service-blob-storage index exports', () => {
	it('should export ServiceBlobStorage from the framework package', () => {
		expect(ServiceBlobStorage).toBeDefined();
		expect(typeof ServiceBlobStorage).toBe('function');
	});
});
