import type { DomainSeedwork } from '@cellix/domain-seedwork';
import { NodeEventBusInstance } from '@cellix/event-bus-seedwork-node';

export const EventBusInstance: DomainSeedwork.EventBus =
	NodeEventBusInstance as DomainSeedwork.EventBus;
