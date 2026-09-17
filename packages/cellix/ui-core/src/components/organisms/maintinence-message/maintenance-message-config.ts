import type { CSSProperties } from 'react';

/**
 * Application-owned formatting and positioning for maintenance messages.
 * Load any non-English Day.js locale in the application before rendering.
 * These values affect presentation only, not maintenance-window comparisons.
 */
export interface MaintenanceMessageDisplayConfig {
	readonly locale: string;
	readonly timeZone: string;
	readonly dateTimeFormat: string;
	readonly dateFormat: string;
	readonly impendingTop: CSSProperties['top'];
	readonly approachingTop: CSSProperties['top'];
}
