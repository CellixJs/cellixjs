import type { EventBus } from '@cellix/domain-seedwork/event-bus';
import { NodeEventBusInstance } from '@cellix/event-bus-seedwork-node';

export const EventBusInstance: EventBus =
	NodeEventBusInstance as EventBus;
