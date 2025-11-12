import * as DomainSeedwork from '@cellix/domain-seedwork/domain-seedwork';
import type { MemberEntityReference } from '../../../community/member/index.ts';
import type { ViolationTicketV1Visa } from './violation-ticket-v1.visa.ts';

export interface ViolationTicketV1RevisionRequestProps
	extends DomainSeedwork.DomainEntityProps {
	requestedAt: Date;
	requestedBy: MemberEntityReference;
	loadRequestedBy: () => Promise<MemberEntityReference>;
	revisionSummary: string;
	requestedChanges: {
		requestUpdatedAssignment: boolean;
		requestUpdatedStatus: boolean;
		requestUpdatedProperty: boolean;
		requestUpdatedPaymentTransaction: boolean;
	};
	revisionSubmittedAt?: Date | undefined;
}

export interface ViolationTicketV1RevisionRequestEntityReference
	extends Readonly<ViolationTicketV1RevisionRequestProps> {}

export class ViolationTicketV1RevisionRequest
	extends DomainSeedwork.DomainEntity<ViolationTicketV1RevisionRequestProps>
	implements ViolationTicketV1RevisionRequestEntityReference
{
	//#region Fields
	private readonly visa: ViolationTicketV1Visa;
	//#endregion Fields

	//#region Constructor
	constructor(
		props: ViolationTicketV1RevisionRequestProps,
		visa: ViolationTicketV1Visa,
	) {
		super(props);
		this.visa = visa;
	}
	//#endregion Constructor

	//#region Methods
	public static getNewInstance(
		newProps: ViolationTicketV1RevisionRequestProps,
		requestedBy: MemberEntityReference,
		revisionSummary: string,
		requestedChanges: ViolationTicketV1RevisionRequestProps['requestedChanges'],
	): ViolationTicketV1RevisionRequest {
		const instance = new ViolationTicketV1RevisionRequest(
			newProps,
			{} as ViolationTicketV1Visa,
		);
		instance.requestedAt = new Date();
		instance.requestedBy = requestedBy;
		instance.revisionSummary = revisionSummary;
		instance.requestedChanges = requestedChanges;
		return instance;
	}

	async loadRequestedBy(): Promise<MemberEntityReference> {
		return await this.props.loadRequestedBy();
	}
	//#endregion Methods

	//#region Properties
	get requestedAt(): Date {
		return this.props.requestedAt;
	}

	private set requestedAt(value: Date) {
		this.props.requestedAt = value;
	}

	get requestedBy(): MemberEntityReference {
		return this.props.requestedBy;
	}

	private set requestedBy(value: MemberEntityReference) {
		this.props.requestedBy = value;
	}

	get revisionSummary(): string {
		return this.props.revisionSummary;
	}

	private set revisionSummary(value: string) {
		this.props.revisionSummary = value;
	}

	get requestedChanges() {
		return this.props.requestedChanges;
	}

	private set requestedChanges(value: ViolationTicketV1RevisionRequestProps['requestedChanges']) {
		this.props.requestedChanges = value;
	}

	get revisionSubmittedAt(): Date | undefined {
		return this.props.revisionSubmittedAt;
	}

	set revisionSubmittedAt(value: Date | undefined) {
		if (
			!this.visa.determineIf(
				(permissions) =>
					permissions.canManageTickets || permissions.isSystemAccount,
			)
		) {
			throw new DomainSeedwork.PermissionError(
				'You do not have permission to submit this revision request',
			);
		}
		this.props.revisionSubmittedAt = value;
	}
	//#endregion Properties
}
