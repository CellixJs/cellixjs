import { describe, expect, it } from 'vitest';
import { ServiceBlobStorageClientUpload } from './client-upload-service.ts';

describe('ServiceBlobStorageClientUpload', () => {
	it('should implement ClientUploadService and ServiceBase interfaces', () => {
		// Check that the class has required methods
		expect(ServiceBlobStorageClientUpload.prototype).toHaveProperty('startUp');
		expect(ServiceBlobStorageClientUpload.prototype).toHaveProperty('shutDown');
		expect(ServiceBlobStorageClientUpload.prototype).toHaveProperty('createUploadUrl');
		expect(ServiceBlobStorageClientUpload.prototype).toHaveProperty('createReadUrl');
	});

	it('should throw when connection string is empty', () => {
		expect(() => {
			new ServiceBlobStorageClientUpload('');
		}).toThrow();
	});
});
