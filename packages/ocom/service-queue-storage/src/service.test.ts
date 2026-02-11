/**
 * ServiceQueueStorage Tests
 */

import { describe, it, expect } from 'vitest';
import { ServiceQueueStorage } from './service.ts';

describe('ServiceQueueStorage', () => {
	it('should throw error if connection string is empty', () => {
		expect(() => new ServiceQueueStorage('')).toThrow(
			'Azure Storage connection string is required',
		);
	});
	
	it('should throw error if connection string is not provided', () => {
		expect(() => new ServiceQueueStorage(undefined as unknown as string)).toThrow(
			'Azure Storage connection string is required',
		);
	});
	
	it('should accept valid connection string', () => {
		const service = new ServiceQueueStorage('DefaultEndpointsProtocol=http;AccountName=test');
		expect(service).toBeDefined();
	});
});
