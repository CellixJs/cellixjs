import type { DomainEvent } from './domain-event.ts';

export interface HandleEvent<T> {
	handle(event: T): void;
}

export class HandleEventImpl<T extends DomainEvent> implements HandleEvent<T> {
	private readonly eventHandler: (event: T) => void;

	constructor(eventHandler: (event: T) => void) {
		this.eventHandler = eventHandler;
	}

	public static register<T extends DomainEvent>(
		eventHandler: (event: T) => void,
	): HandleEvent<T> {
		return new HandleEventImpl(eventHandler);
	}

	registerAll(eventHandlers: HandleEvent<T>[]): HandleEvent<T> {
		return new HandleEventImpl((event) => {
			eventHandlers.forEach((eh) => {
				eh.handle(event);
			});
		});
	}

	handle(event: T): void {
		this.eventHandler(event);
	}
}
