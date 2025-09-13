//// Sync Domain Event
// biome-ignore lint:noEmptyInterface
export interface SyncDomainEventPayloadBaseType {}

export interface SyncDomainEventType<
	EventPayloadType extends SyncDomainEventPayloadBaseType,
> {
	get payload(): EventPayloadType;
	set payload(payload: EventPayloadType);
}

export abstract class SyncDomainEventImpl<
	EventPayloadType extends SyncDomainEventPayloadBaseType,
> implements SyncDomainEventType<EventPayloadType>
{
	private _payload?: EventPayloadType;
	get payload(): EventPayloadType {
		if (this._payload === undefined) {
			throw new Error('Payload is not set');
		}
		return this._payload;
	}
	set payload(payload: EventPayloadType) {
		this._payload = payload;
	}
}

/*
//// Sync Domain Event Bus
export interface SyncDomainEventBus {

    get events(): SyncDomainEventType< any>[];
    addEvent<EventPayloadType extends SyncDomainEventPayloadBaseType, EventType extends SyncDomainEventType<EventPayloadType>>(
        event: new () => EventType, 
        payload: EventPayloadType
    ) : void
    clearEvents (): void;
}

export class SyncDomainEventBusImpl implements SyncDomainEventBus {
    private _events: SyncDomainEventType<any>[] = [];

    public get events(): SyncDomainEventType<any>[] {
        return this._events;
    }

    public addEvent<EventPayloadType extends any, T extends SyncDomainEventType<EventPayloadType>>(
        event: new () => T, 
        payload: EventPayloadType
    ) : void {
        let eventToAdd = new event();
        eventToAdd.payload = payload;
        this._events.push(eventToAdd);
    }

    public clearEvents (): void {
        this._events.splice(0, this._events.length);
    }
}
*/
