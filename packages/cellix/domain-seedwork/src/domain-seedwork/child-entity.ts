//TODO: Add a description of the file and its purpose - note why it does not extend DomainEntityProps
export abstract class ChildEntity<PropType> {
	public readonly props: PropType;

	public constructor(props: PropType) {
		this.props = props;
	}
}
