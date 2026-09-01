import type { PropertyVisa } from './property.visa.ts';

/**
 * The minimum immutable property state required to evaluate property access.
 * Keeping this narrower than the aggregate lets collection operations
 * authorize a community before querying rows without manufacturing a fake
 * Property aggregate.
 */
export interface PropertyAuthorizationSubject {
	readonly community: {
		readonly id: string;
	};
	readonly owner?: {
		readonly id: string;
	} | null;
}

export interface PropertyPassport {
	forProperty(root: PropertyAuthorizationSubject): PropertyVisa;
}
