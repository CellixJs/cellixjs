import type { PropertyVisa } from './property.visa.ts';
import type { PropertyEntityReference } from './property/property.ts';

export interface PropertyPassport {
	forProperty(root: PropertyEntityReference): PropertyVisa;
}
