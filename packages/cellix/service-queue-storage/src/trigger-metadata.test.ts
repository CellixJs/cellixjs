import { describe, expect, it } from 'vitest';
import { extractQueueTriggerMetadata } from './trigger-metadata.ts';

describe('extractQueueTriggerMetadata', () => {
	it('extracts id, popReceipt, and dequeueCount when all are present', () => {
		const metadata = extractQueueTriggerMetadata({
			id: 'msg-1',
			popReceipt: 'receipt-1',
			dequeueCount: 2,
		});

		expect(metadata).toStrictEqual({
			id: 'msg-1',
			popReceipt: 'receipt-1',
			dequeueCount: 2,
		});
	});

	it('defaults id to an empty string when triggerMetadata is undefined', () => {
		const metadata = extractQueueTriggerMetadata(undefined);

		expect(metadata).toStrictEqual({ id: '' });
	});

	it('defaults id to an empty string when id is missing', () => {
		const metadata = extractQueueTriggerMetadata({ popReceipt: 'receipt-1' });

		expect(metadata).toStrictEqual({ id: '', popReceipt: 'receipt-1' });
	});

	it('omits popReceipt and dequeueCount keys entirely when they are undefined', () => {
		const metadata = extractQueueTriggerMetadata({ id: 'msg-1' });

		expect(metadata).toStrictEqual({ id: 'msg-1' });
		expect('popReceipt' in metadata).toBe(false);
		expect('dequeueCount' in metadata).toBe(false);
	});
});
