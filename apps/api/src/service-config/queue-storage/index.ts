import type { QueueLoggingConfig } from '@ocom/service-queue-storage';

const logging: QueueLoggingConfig = {
	enabled: true,
	container: 'queue-logs',
	await: false,
};

export { logging };
