import type { DomainEntityProps } from '@cellix/domain-seedwork/domain-entity';
import { DomainEntity, PermissionError } from '@cellix/domain-seedwork/domain-entity';
import type { CommunityVisa } from '../community.visa.ts';

export interface CommunityTransactionReferenceProps {
	vendor?: string | null;
	isSuccess?: boolean | null;
	lastRequestedAt?: Date | null;
	referenceId?: string | null;
	transactionId?: string | null;
	reconciliationId?: string | null;
	completedAt?: Date | null;
	errorOccurredAt?: Date | null;
	errorCode?: string | null;
	errorMessage?: string | null;
}

export interface CommunityTransactionProps extends DomainEntityProps {
	amount: number;
	transactionReference: CommunityTransactionReferenceProps;
	createdAt?: Date | undefined;
	updatedAt?: Date | undefined;
}

export interface CommunityTransactionEntityReference extends Readonly<CommunityTransactionProps> {}

export class CommunityTransaction extends DomainEntity<CommunityTransactionProps> implements CommunityTransactionEntityReference {
	private readonly visa: CommunityVisa;

	constructor(props: CommunityTransactionProps, visa: CommunityVisa) {
		super(props);
		this.visa = visa;
	}

	private validateVisa(): void {
		if (!this.visa.determineIf((domainPermissions) => domainPermissions.canManageCommunitySettings || domainPermissions.isSystemAccount)) {
			throw new PermissionError('You do not have permission to change billing transactions for this community');
		}
	}

	get amount(): number {
		return this.props.amount;
	}
	set amount(amount: number) {
		this.validateVisa();
		if (!Number.isFinite(amount) || amount < 0) {
			throw new Error('Transaction amount must be a non-negative number');
		}
		this.props.amount = amount;
	}

	get transactionReference(): CommunityTransactionReferenceProps {
		return this.props.transactionReference;
	}
	set transactionReference(transactionReference: CommunityTransactionReferenceProps) {
		this.validateVisa();
		this.props.transactionReference = transactionReference;
	}

	get createdAt(): Date | undefined {
		return this.props.createdAt;
	}

	get updatedAt(): Date | undefined {
		return this.props.updatedAt;
	}
}
