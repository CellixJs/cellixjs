import type { MaintenanceMessageDisplayConfig } from '@cellix/ui-core';

export const maintenancePortalKeys = {
	staff: 'UI_STAFF_PORTAL',
	community: 'UI_COMMUNITY_PORTAL',
} as const;

export const maintenanceMessageDisplayConfig: MaintenanceMessageDisplayConfig = {
	locale: 'en',
	timeZone: 'America/New_York',
	dateTimeFormat: 'h:mm a on dddd, MMMM DD, YYYY',
	dateFormat: 'MMMM DD',
	impendingTop: '60px',
	approachingTop: '100px',
};
