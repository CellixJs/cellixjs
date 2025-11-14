import type { PropertyEntityReference } from './property/property.aggregate.ts';
import type { PropertyVisa } from './property.visa.ts';

export interface PropertyPassport {
	forProperty(root: PropertyEntityReference): PropertyVisa;
}
