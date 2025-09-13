import type { DomainSeedwork } from '@cellix/domain-seedwork';

class InProcEventBusImpl implements DomainSeedwork.EventBus {
	private eventSubscribers: {
		[eventType: string]: Array<(rawpayload: string) => Promise<void>>;
	} = {};
	private static instance: InProcEventBusImpl;

	async dispatch<T extends DomainSeedwork.DomainEvent>(
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

	register<EventProps, T extends DomainSeedwork.CustomDomainEvent<EventProps>>(
		event: new (aggregateId: string) => T,
		func: (payload: T['payload']) => Promise<void>,
	): void {
		console.log(`Registering in-proc event handler for: ${event.name}`);
		this.eventSubscribers[event.name] ??= [] as Array<
			(rawpayload: string) => Promise<void>
		>; // Ensure the array exists
		(
			this.eventSubscribers[event.name] as Array<
				(rawpayload: string) => Promise<void>
			>
		).push(async (rawpayload: string) => {
			console.log(
				`Received in-proc event ${event.name} with data ${rawpayload}`,
			);
			await func(JSON.parse(rawpayload) as T['payload']);
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
