// biome-ignore lint/suspicious/noEmptyInterface: This is a base interface for value objects.
export interface ValueObjectProps {}

export abstract class ValueObject<PropType extends ValueObjectProps> {
	protected readonly props: PropType;

	public constructor(props: PropType) {
		this.props = props;
	}
}
