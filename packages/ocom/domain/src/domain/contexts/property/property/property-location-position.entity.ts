import * as DomainSeedwork from '@cellix/domain-seedwork/domain-seedwork';

export interface PropertyLocationPositionProps
	extends DomainSeedwork.ValueObjectProps {
	type: string | null;
	coordinates: ReadonlyArray<number> | null;
}

export interface PropertyLocationPositionEntityReference
	extends Readonly<PropertyLocationPositionProps> {}

export class PropertyLocationPosition
	extends DomainSeedwork.ValueObject<PropertyLocationPositionProps>
	implements PropertyLocationPositionEntityReference
{
	get type(): string | null {
		return this.props.type;
	}

	get coordinates(): ReadonlyArray<number> | null {
		return this.props.coordinates;
	}
}
