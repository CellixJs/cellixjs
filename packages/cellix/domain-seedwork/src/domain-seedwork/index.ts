/**
 * Domain Seedwork - Core building blocks for domain-driven design
 * 
 * This module provides base classes for implementing aggregates, entities,
 * value objects, and domain events following DDD patterns.
 */

import { AggregateRoot, type RootEventRegistry } from './aggregate-root.ts';
import type { BaseDomainExecutionContext } from './base-domain-execution-context.ts';
import { ChildEntity } from './child-entity.ts';
import { DomainEntity, type DomainEntityProps, PermissionError } from './domain-entity.ts';
import { type CustomDomainEvent, CustomDomainEventImpl, type DomainEvent } from './domain-event.ts';
import type { EventBus } from './event-bus.ts';
import type { PropArray } from './prop-array.ts';
import { NotFoundError, type Repository } from './repository.ts';
import type { TypeConverter } from './type-converter.ts';
import type { InitializedUnitOfWork, UnitOfWork } from './unit-of-work.ts';
import { ValueObject, type ValueObjectProps } from './value-object.ts';

export { AggregateRoot, type RootEventRegistry };
export type { BaseDomainExecutionContext };
export { ChildEntity };
export { DomainEntity, type DomainEntityProps, PermissionError };
export { type CustomDomainEvent, CustomDomainEventImpl, type DomainEvent };
export type { EventBus };
export type { PropArray };
export { NotFoundError, type Repository };
export type { TypeConverter };
export type { InitializedUnitOfWork, UnitOfWork };
export { ValueObject, type ValueObjectProps };
