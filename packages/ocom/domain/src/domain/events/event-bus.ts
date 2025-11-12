import type * as DomainSeedwork from '@cellix/domain-seedwork/domain-seedwork';
import { NodeEventBusInstance } from '@cellix/event-bus-seedwork-node';

export const EventBusInstance: DomainSeedwork.EventBus =
	NodeEventBusInstance as DomainSeedwork.EventBus;
