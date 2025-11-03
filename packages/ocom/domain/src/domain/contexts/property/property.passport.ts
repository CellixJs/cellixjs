import type { PropertyVisa } from './property.visa.ts';
import type { PropertyEntityReference } from './property/property.aggregate.ts';

export interface PropertyPassport {
	forProperty(root: PropertyEntityReference): PropertyVisa;
}
