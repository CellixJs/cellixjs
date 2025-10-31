import type { CustomDomainEvent, DomainEvent } from './domain-event.ts';

export interface EventBus {
	dispatch<T extends { payload: unknown } & DomainEvent>(
		event: new (aggregateId: string) => T,
		data: T['payload'],
	): Promise<void>;
	//  register<T extends DomainEvent>(event: T,listener: HandleEvent<T>): void;
	register<EventProps, T extends CustomDomainEvent<EventProps>>(
		event: new (aggregateId: string) => T,
		func: (payload: T['payload']) => Promise<void>,
	): void;
}
