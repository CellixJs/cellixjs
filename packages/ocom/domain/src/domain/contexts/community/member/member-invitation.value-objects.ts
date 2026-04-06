import { VOString } from '@lucaspaganini/value-objects';

/**
 * Email address for member invitation
 */
class InvitationEmailBase extends VOString({
	trim: true,
	maxLength: 254,
	minLength: 1,
}) {}

export class InvitationEmail extends InvitationEmailBase {
	constructor(value: string) {
		super(value);
		// Basic email validation
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(value)) {
			throw new Error('Invalid email format');
		}
	}

	get normalizedValue(): string {
		return this.valueOf().toLowerCase();
	}
}

/**
 * Invitation message sent to invitees
 */
export class InvitationMessage extends VOString({
	trim: true,
	maxLength: 1000,
	minLength: 0,
}) {}

/**
 * Invitation status tracking
 */
const InvitationStatuses = {
	PENDING: 'PENDING',
	SENT: 'SENT',
	ACCEPTED: 'ACCEPTED',
	REJECTED: 'REJECTED',
	EXPIRED: 'EXPIRED',
} as const;

type InvitationStatusEnum = (typeof InvitationStatuses)[keyof typeof InvitationStatuses];

class InvitationStatusBase extends VOString({
	trim: true,
	maxLength: 20,
	minLength: 1,
}) {}

export class InvitationStatus extends InvitationStatusBase {
	constructor(value: string) {
		const upperValue = value.toUpperCase();
		super(upperValue);
		if (!Object.values(InvitationStatuses).includes(upperValue as InvitationStatusEnum)) {
			throw new Error(`Invalid invitation status: ${value}. Must be one of: ${Object.values(InvitationStatuses).join(', ')}`);
		}
	}

	get isPending(): boolean {
		return this.valueOf() === InvitationStatuses.PENDING;
	}

	get isSent(): boolean {
		return this.valueOf() === InvitationStatuses.SENT;
	}

	get isAccepted(): boolean {
		return this.valueOf() === InvitationStatuses.ACCEPTED;
	}

	get isRejected(): boolean {
		return this.valueOf() === InvitationStatuses.REJECTED;
	}

	get isExpired(): boolean {
		return this.valueOf() === InvitationStatuses.EXPIRED;
	}

	get isActive(): boolean {
		return this.isPending || this.isSent;
	}
}

/**
 * Invitation expiration date
 */
export class InvitationExpiresAt {
	private readonly _value: Date;

	constructor(expiresAt: Date) {
		const now = new Date();
		if (expiresAt <= now) {
			throw new Error('Invitation expiration date must be in the future');
		}
		this._value = expiresAt;
	}

	valueOf(): Date {
		return this._value;
	}

	get value(): Date {
		return this._value;
	}

	get isExpired(): boolean {
		return this._value <= new Date();
	}

	get daysUntilExpiration(): number {
		const now = new Date();
		const diffTime = this._value.getTime() - now.getTime();
		return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
	}
}
