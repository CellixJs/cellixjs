import type * as DomainSeedwork from '@cellix/domain-seedwork/domain-seedwork';
import { NodeEventBusInstance } from '@cellix/event-bus-seedwork-node/node-event-bus';

export const EventBusInstance: DomainSeedwork.EventBus =
	NodeEventBusInstance as DomainSeedwork.EventBus;
