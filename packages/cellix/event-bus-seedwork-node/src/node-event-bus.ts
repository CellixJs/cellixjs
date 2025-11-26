import type { EventBus } from '@cellix/domain-seedwork/event-bus';
import type { CustomDomainEvent, DomainEvent } from '@cellix/domain-seedwork/domain-event';
import EventEmitter from 'node:events';
import { performance } from 'node:perf_hooks';
import api, { trace, SpanStatusCode } from '@opentelemetry/api';
// import { SEMATTRS_DB_SYSTEM, SEMATTRS_DB_NAME, SEMATTRS_DB_STATEMENT } from '@opentelemetry/semantic-conventions';
// not sure where to import these from, see link below
// https://github.com/open-telemetry/opentelemetry-js/blob/main/semantic-conventions/README.md#migrated-usage
const ATTR_DB_SYSTEM = 'db.system';
const ATTR_DB_NAME = 'db.name';
const ATTR_DB_STATEMENT = 'db.statement';

class BroadCaster {
	private eventEmitter: EventEmitter;

	constructor() {
		this.eventEmitter = new EventEmitter();
	}

	public broadcast(event: string, data: unknown): void {
		// Collect all listeners for the event
		const listeners = this.eventEmitter.listeners(event);
		// Fire and forget for each listener
		for (const listener of listeners) {
			if (typeof listener === 'function') {
				void listener(data);
			}
		}
	}
	public on(
		event: string,
		listener: (rawPayload: unknown) => Promise<void> | void,
	) {
		this.eventEmitter.on(event, (data) => {
			// Call the listener and ignore any returned Promise
			void listener(data);
		});
	}

	public removeAllListeners() {
		this.eventEmitter.removeAllListeners();
		console.log('All listeners removed');
	}
}

class NodeEventBusImpl implements EventBus {
	private static instance: NodeEventBusImpl;
	private broadcaster: BroadCaster;

	private constructor() {
		this.broadcaster = new BroadCaster();
	}

	removeAllListeners() {
		this.broadcaster.removeAllListeners();
	}

	// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-parameters
	async dispatch<T extends DomainEvent>(
		event: new (aggregateId: string) => T,
		data: unknown,
	): Promise<void> {
		console.log(
			`Dispatching node event (${event.name} or ${event.name}) with data ${JSON.stringify(data)}`,
		);

		const contextObject = {};
		api.propagation.inject(api.context.active(), contextObject);

		const tracer = trace.getTracer('PG:data-access');
		await tracer.startActiveSpan('node-event-bus.publish', async (span) => {
			span.setAttribute('message.system', 'node-event-bus');
			span.setAttribute('messaging.operation', 'publish');
			span.setAttribute('messaging.destination.name', event.name);
			span.addEvent(
				'dispatching node event',
				{ name: event.name, data: JSON.stringify(data) },
				new Date(),
			);

			try {
				await this.broadcaster.broadcast(event.name, {
					data: JSON.stringify(data),
					context: contextObject,
				});
				span.setStatus({
					code: SpanStatusCode.OK,
					message: `NodeEventBus: Executed ${event.name}`,
				});
			} catch (err) {
				span.setStatus({ code: SpanStatusCode.ERROR });
				if (err instanceof Error) {
					span.recordException(err);
				} else {
					span.recordException(new Error(String(err)));
				}
			} finally {
				span.end();
			}
		});
	}

	register<EventProps, T extends CustomDomainEvent<EventProps>>(
		event: new (aggregateId: string) => T,
		func: (payload: T['payload']) => Promise<void>,
	): void {
		console.log(`custom-log | registering-node-event-handler | ${event.name}`);

		this.broadcaster.on(event.name, async (rawPayload: unknown) => {
			if (typeof rawPayload !== 'object' || rawPayload === null || !('data' in rawPayload) || !('context' in rawPayload)) {
				console.error(`Invalid payload for event ${event.name}`);
				return;
			}
			const payload = rawPayload;
			console.log(
				`Received node event ${event.name} with data ${JSON.stringify(payload)}`,
			);
			const payloadContext = 'context' in payload && typeof payload.context === 'object' && payload.context !== null ? payload.context : {};
			const activeContext = api.propagation.extract(
				api.context.active(),
				payloadContext,
			);
			await api.context.with(activeContext, async () => {
				// all descendants of this context will have the active context set
				const tracer = trace.getTracer('PG:data-access');
				await tracer.startActiveSpan(`node-event-bus.process`, async (span) => {
					span.setAttribute('message.system', 'node-event-bus');
					span.setAttribute('messaging.operation', 'process');
					span.setAttribute('messaging.destination.name', event.name);

					span.setStatus({
						code: SpanStatusCode.UNSET,
						message: `NodeEventBus: Executing ${event.name}`,
					});
					const payloadData = 'data' in payload && typeof payload.data === 'string' ? payload.data : '';
					span.setAttribute('data', payloadData);

					// hack to create dependency title in App Insights to show up nicely in trace details
					// see : https://github.com/Azure/azure-sdk-for-js/blob/main/sdk/monitor/monitor-opentelemetry-exporter/src/utils/spanUtils.ts#L191
					span.setAttribute(ATTR_DB_SYSTEM, 'node-event-bus'); // hack (becomes upper case)
					span.setAttribute(ATTR_DB_NAME, event.name); // hack
					span.setAttribute(
						ATTR_DB_STATEMENT,
						`handling event: ${event.name} with payload: ${payloadData}`,
					); // hack - dumps payload in command

					span.addEvent(
						`NodeEventBus: Executing ${event.name}`,
						{ data: payloadData },
						performance.now(),
					);
					try {
						const parsed = JSON.parse(payloadData);
						await func(parsed);
						span.setStatus({
							code: SpanStatusCode.OK,
							message: `NodeEventBus: Executed ${event.name}`,
						});
					} catch (e) {
						if (e instanceof Error) {
							span.recordException(e);
						} else {
							span.recordException(new Error(String(e)));
						}
						span.setStatus({
							code: SpanStatusCode.ERROR,
							message: `NodeEventBus: Error executing ${event.name}`,
						});
						console.error(
							`Error handling node event ${event.name} with data ${JSON.stringify(payload)}`,
						);
						if (e instanceof Error) {
							console.error(e);
						} else {
							console.error(new Error(String(e)));
						}
					} finally {
						span.end();
					}
				});
			});
		});
	}

	public static getInstance(): NodeEventBusImpl {
		// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
		if (!NodeEventBusImpl.instance) {
			NodeEventBusImpl.instance = new NodeEventBusImpl();
		}
		return NodeEventBusImpl.instance;
	}
}

export const NodeEventBusInstance = NodeEventBusImpl.getInstance();
