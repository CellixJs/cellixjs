export interface CustomDomainEvent<T> extends DomainEvent {
	get payload(): T;
	set payload(payload: T);
}

export interface DomainEvent {
	get aggregateId(): string;
}

export abstract class DomainEventBase implements DomainEvent {
	private readonly _aggregateId: string;

	constructor(aggregateId: string) {
		this._aggregateId = aggregateId;
	}
	get aggregateId(): string {
		return this._aggregateId;
	}
}

export abstract class CustomDomainEventImpl<T>
	extends DomainEventBase
	implements CustomDomainEvent<T>
{
	private _payload?: T;
	get payload(): T {
		if (this._payload === undefined) {
			throw new Error('Payload is not set');
		}
		return this._payload;
	}
	set payload(payload: T) {
		this._payload = payload;
	}
}
