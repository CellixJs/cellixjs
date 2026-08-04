import { type TechAdminQueue, techAdminQueueDefinitions } from './queue-list.ts';

export function listQueues(checkPermission: () => Promise<void>): () => Promise<TechAdminQueue[]> {
	return async (): Promise<TechAdminQueue[]> => {
		await checkPermission();
		return techAdminQueueDefinitions.map(({ name }) => ({ name })).sort((left, right) => left.name.localeCompare(right.name));
	};
}
