import type { Service } from '@ocom/data-sources-mongoose-models/service';
import { COMMUNITY_IDS } from './communities.ts';

const SERVICE_IDS = {
	lawnCare: 'f00000000000000000000001',
	poolMaintenance: 'f00000000000000000000002',
} as const;

export const services = [
	{
		_id: SERVICE_IDS.lawnCare,
		serviceName: 'Lawn Care',
		description: 'Weekly lawn mowing, edging, and seasonal fertilization for community properties.',
		isActive: true,
		community: COMMUNITY_IDS.riverside,
		schemaVersion: '1.0.0',
		version: 0,
		createdAt: new Date('2024-03-01T00:00:00Z'),
		updatedAt: new Date('2024-03-01T00:00:00Z'),
	},
	{
		_id: SERVICE_IDS.poolMaintenance,
		serviceName: 'Pool Maintenance',
		description: 'Community pool cleaning, chemical balancing, and equipment inspection.',
		isActive: true,
		community: COMMUNITY_IDS.riverside,
		schemaVersion: '1.0.0',
		version: 0,
		createdAt: new Date('2024-03-01T00:00:00Z'),
		updatedAt: new Date('2024-03-01T00:00:00Z'),
	},
] as unknown as Service[];
