import { describe, expect, it, vi } from 'vitest';
import { sendMessage } from './send-message.ts';

describe('sendMessage', () => {
	it('requires an operator reason without adding it to the queue payload', async () => {
		const sendMessageToRegisteredQueue = vi.fn().mockResolvedValue(undefined);
		const sendQueueMessage = sendMessage({ sendMessageToRegisteredQueue }, vi.fn().mockResolvedValue(undefined));

		await expect(sendQueueMessage({ queueName: 'community-creation', payload: { communityId: 'community-1' }, reason: 'Replaying a failed request' })).resolves.toBeUndefined();
		expect(sendMessageToRegisteredQueue).toHaveBeenCalledWith(
			'community-creation',
			{ communityId: 'community-1' },
			{
				loggingTags: { source: 'TECH-ADMIN' },
				loggingMetadata: { reason: 'Replaying a failed request' },
			},
		);

		await expect(sendQueueMessage({ queueName: 'community-creation', payload: {}, reason: '  ' })).rejects.toThrow('Reason is required');
	});
});
