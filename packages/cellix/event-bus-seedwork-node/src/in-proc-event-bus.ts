import type { CustomDomainEvent, DomainEvent } from '@cellix/domain-seedwork/domain-event';
import type { EventBus } from '@cellix/domain-seedwork/event-bus';

class InProcEventBusImpl implements EventBus {
	private eventSubscribers: {
		[eventType: string]: Array<(rawpayload: string) => Promise<void>>;
	} = {};
	private static instance: InProcEventBusImpl;

	async dispatch<T extends DomainEvent>(
		event: new (aggregateId: string) => T,
		data: unknown,
	): Promise<void> {
		console.log(
			`Dispatching in-proc event ${event.name} or ${event.name} with data ${JSON.stringify(data)}`,
		);
		if (this.eventSubscribers[event.name]) {
			const subscribers = this.eventSubscribers[event.name];
			if (subscribers) {
				for (const subscriber of subscribers) {
					await subscriber(JSON.stringify(data));
				}
			}
		}
	}

	register<EventProps, T extends CustomDomainEvent<EventProps>>(
		event: new (aggregateId: string) => T,
		func: (payload: T['payload']) => Promise<void>,
	): void {
		console.log(`Registering in-proc event handler for: ${event.name}`);
		this.eventSubscribers[event.name] ??= [];
		this.eventSubscribers[event.name]?.push(async (rawpayload: string) => {
			console.log(
				`Received in-proc event ${event.name} with data ${rawpayload}`,
			);
			await func(JSON.parse(rawpayload));
		});
	}

	public static getInstance(): InProcEventBusImpl {
		if (!InProcEventBusImpl.instance) {
			InProcEventBusImpl.instance = new InProcEventBusImpl();
		}
		return InProcEventBusImpl.instance;
	}
}

export const InProcEventBusInstance = InProcEventBusImpl.getInstance();
