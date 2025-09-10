import { DomainSeedwork } from '@cellix/domain-seedwork';
import type { CommunityVisa } from '../community.visa.ts';
import * as ValueObjects from './member-custom-view.value-objects.ts';

export interface MemberCustomViewProps
	extends DomainSeedwork.DomainEntityProps {
	name: string;
	type: string;
	filters: string[];
	sortOrder: string;
	columnsToDisplay: string[];
}

export interface MemberCustomViewEntityReference
	extends Readonly<MemberCustomViewProps> {}

export class MemberCustomView
	extends DomainSeedwork.DomainEntity<MemberCustomViewProps>
	implements MemberCustomViewEntityReference
{
	//#region Fields
	private readonly visa: CommunityVisa;
	//#endregion Fields

	//#region Constructors
	constructor(props: MemberCustomViewProps, visa: CommunityVisa) {
		super(props);
		this.visa = visa;
	}
	//#endregion Constructors

	//#region Methods
	private validateVisa() {
		if (
			!this.visa.determineIf(
				(permissions) =>
					permissions.isSystemAccount ||
					permissions.canManageMembers ||
					(permissions.canEditOwnMemberAccounts &&
						permissions.isEditingOwnMemberAccount),
			)
		) {
			throw new DomainSeedwork.PermissionError(
				'You do not have permission to update this account',
			);
		}
	}
	//#endregion Methods

	//#region Properties
	get name(): string {
		return this.props.name;
	}
	set name(name: string) {
		this.validateVisa();
		this.props.name = new ValueObjects.CustomViewName(name).valueOf();
	}

	get type(): string {
		return this.props.type;
	}
	set type(type: string) {
		this.validateVisa();
		this.props.type = new ValueObjects.CustomViewType(type).valueOf();
	}

	get filters(): string[] {
		return this.props.filters;
	}
	set filters(filters: string[]) {
		this.validateVisa();
		this.props.filters = new ValueObjects.CustomViewFilters(filters).valueOf();
	}

	get sortOrder(): string {
		return this.props.sortOrder;
	}
	set sortOrder(sortOrder: string) {
		this.validateVisa();
		this.props.sortOrder = new ValueObjects.CustomViewSortOrder(
			sortOrder,
		).valueOf();
	}

	get columnsToDisplay(): string[] {
		return this.props.columnsToDisplay;
	}
	set columnsToDisplay(columnsToDisplay: string[]) {
		this.validateVisa();
		this.props.columnsToDisplay = new ValueObjects.CustomViewColumnsToDisplay(
			columnsToDisplay,
		).valueOf();
	}
	//#endregion Properties
}
