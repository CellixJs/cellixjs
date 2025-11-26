import type { EventBus } from '@cellix/domain-seedwork/event-bus';
import { NodeEventBusInstance } from '@cellix/event-bus-seedwork-node';

// biome-ignore lint/plugin/no-type-assertion: test file
export const EventBusInstance: EventBus = NodeEventBusInstance as EventBus;
