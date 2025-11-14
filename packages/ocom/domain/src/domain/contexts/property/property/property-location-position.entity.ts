import { ValueObject } from '@cellix/domain-seedwork/value-object';
import type { ValueObjectProps } from '@cellix/domain-seedwork/value-object';
export interface PropertyLocationPositionProps extends ValueObjectProps {
	type: string | null;
	coordinates: ReadonlyArray<number> | null;
}

export interface PropertyLocationPositionEntityReference
	extends Readonly<PropertyLocationPositionProps> {}

export class PropertyLocationPosition
	extends ValueObject<PropertyLocationPositionProps>
	implements PropertyLocationPositionEntityReference
{
	get type(): string | null {
		return this.props.type;
	}

	get coordinates(): ReadonlyArray<number> | null {
		return this.props.coordinates;
	}
}
