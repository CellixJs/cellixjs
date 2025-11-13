import * as DomainSeedwork from '@cellix/domain-seedwork/domain-seedwork';
import type { MemberEntityReference } from '../../../community/member/member.ts';
import type { CaseDomainPermissions } from '../../case.domain-permissions.ts';
import type { ServiceTicketV1Visa } from './service-ticket-v1.visa.ts';
import type * as ValueObjects from './service-ticket-v1-message.value-objects.ts';

/**
 * Props for ServiceTicketV1Message
 */
export interface ServiceTicketV1MessageProps
	extends DomainSeedwork.DomainEntityProps {
	sentBy: string;
	initiatedBy: MemberEntityReference;
	loadInitiatedBy: () => Promise<MemberEntityReference>;
	message: string;
	embedding: string | undefined;
	createdAt: Date;
	isHiddenFromApplicant: boolean;
}

export interface ServiceTicketV1MessageEntityReference
	extends Readonly<ServiceTicketV1MessageProps> {}

/**
 * ServiceTicketV1Message entity
 */
export class ServiceTicketV1Message
	extends DomainSeedwork.DomainEntity<ServiceTicketV1MessageProps>
	implements ServiceTicketV1MessageEntityReference
{
	//#region Fields
	private readonly visa: ServiceTicketV1Visa;
	//#endregion Fields

	//#region Constructor
	constructor(props: ServiceTicketV1MessageProps, visa: ServiceTicketV1Visa) {
		super(props);
		this.visa = visa;
	}
	//#endregion Constructor

	//#region Methods
	async loadInitiatedBy(): Promise<MemberEntityReference> {
		return await this.props.loadInitiatedBy();
	}
	//#endregion Methods

	//#region Properties

	get sentBy(): string {
		return this.props.sentBy;
	}
	set sentBy(sentBy: ValueObjects.SentBy) {
		if (
			!this.visa.determineIf(
				(permissions: CaseDomainPermissions) =>
					permissions.canManageTickets || permissions.isSystemAccount,
			)
		) {
			throw new DomainSeedwork.PermissionError(
				'You do not have permission to modify this message',
			);
		}
		this.props.sentBy = sentBy.valueOf();
	}

	get initiatedBy(): MemberEntityReference {
		return this.props.initiatedBy;
	}

	get message(): string {
		return this.props.message;
	}
	set message(message: ValueObjects.Message) {
		if (
			!this.visa.determineIf(
				(permissions: CaseDomainPermissions) =>
					permissions.canManageTickets || permissions.isSystemAccount,
			)
		) {
			throw new DomainSeedwork.PermissionError(
				'You do not have permission to modify this message',
			);
		}
		this.props.message = message.valueOf();
	}

	get embedding(): string | undefined {
		return this.props.embedding;
	}
	set embedding(embedding: ValueObjects.Embedding) {
		if (
			!this.visa.determineIf(
				(permissions: CaseDomainPermissions) =>
					permissions.canManageTickets || permissions.isSystemAccount,
			)
		) {
			throw new DomainSeedwork.PermissionError(
				'You do not have permission to modify this message',
			);
		}
		this.props.embedding = embedding.valueOf();
	}

	get createdAt(): Date {
		return this.props.createdAt;
	}
	set createdAt(createdAt: Date) {
		if (
			!this.visa.determineIf(
				(permissions: CaseDomainPermissions) => permissions.isSystemAccount,
			)
		) {
			throw new DomainSeedwork.PermissionError(
				'You do not have permission to modify this message timestamp',
			);
		}
		this.props.createdAt = createdAt;
	}

	get isHiddenFromApplicant(): boolean {
		return this.props.isHiddenFromApplicant;
	}
	set isHiddenFromApplicant(isHiddenFromApplicant: boolean) {
		if (
			!this.visa.determineIf(
				(permissions: CaseDomainPermissions) =>
					permissions.canManageTickets || permissions.isSystemAccount,
			)
		) {
			throw new DomainSeedwork.PermissionError(
				'You do not have permission to modify this message visibility',
			);
		}
		this.props.isHiddenFromApplicant = isHiddenFromApplicant;
	}
	//#endregion Properties
}
