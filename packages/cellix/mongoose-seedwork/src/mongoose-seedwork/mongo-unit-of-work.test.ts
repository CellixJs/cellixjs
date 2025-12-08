/* eslint-disable @typescript-eslint/no-explicit-any */
import { AggregateRoot } from '@cellix/domain-seedwork/aggregate-root';
import type { DomainEntityProps } from '@cellix/domain-seedwork/domain-entity';
import { CustomDomainEventImpl } from '@cellix/domain-seedwork/domain-event';
import type { EventBus } from '@cellix/domain-seedwork/event-bus';
import type { TypeConverter } from '@cellix/domain-seedwork/type-converter';
import type { InitializedUnitOfWork } from '@cellix/domain-seedwork/unit-of-work';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { expect, vi, type Mock} from 'vitest';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { ClientSession, Model } from 'mongoose';
import mongoose from 'mongoose';
import type { Base } from './index.ts';
import { MongoUnitOfWork, getInitializedUnitOfWork } from './mongo-unit-of-work.ts';
import { MongoRepositoryBase } from './mongo-repository.ts';

// Type alias for test purposes to avoid linting issues

const test = { for: describeFeature };
type PassportType = Record<string, never>;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feature = await loadFeature(
  path.resolve(__dirname, 'features/mongo-unit-of-work.feature')
);

  const Passport = {};

class AggregateRootMock extends AggregateRoot<PropType, typeof Passport> {
  override getIntegrationEvents = vi.fn<() => CustomDomainEventImpl<Record<string, unknown>>[]>(() => []);
  get foo(): string { return this.props.foo; }
  set foo(foo: string) { this.props.foo = foo; }
  get createdAt(): Date { return this.props.createdAt; }
}
interface MongoType extends Base { foo: string; }
type PropType = DomainEntityProps & {
  foo: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly schemaVersion: string;
};
class RepoMock extends MongoRepositoryBase<MongoType, PropType, typeof Passport, AggregateRootMock> {
  override getIntegrationEvents = vi.fn<() => CustomDomainEventImpl<Record<string, unknown>>[]>(() => []);
}

class TestEvent extends CustomDomainEventImpl<{ foo: string }> {}

vi.mock('mongoose', async () => {
  const original = await vi.importActual<typeof import('mongoose')>('mongoose');
  return {
    ...original,
    connection: {
      transaction: vi.fn(),
    },
  };
});

test.for(feature, ({ Scenario, BeforeEachScenario }) => {
  let unitOfWork: MongoUnitOfWork<MongoType, PropType, typeof Passport, AggregateRootMock, RepoMock>;
  let repoInstance: RepoMock;
  let eventBus: EventBus;
  let integrationEventBus: EventBus;
  let session: ClientSession;
  let mockModel: Model<MongoType>;
  let typeConverter: TypeConverter<MongoType, PropType, unknown, AggregateRootMock>;

  const mockRepoClass = vi.fn((_passport, _model, _typeConverter, _bus, _session): RepoMock => repoInstance);
  let domainOperation: Mock<(repository: RepoMock) => Promise<void>>;

  BeforeEachScenario(() => {
    session = {} as ClientSession;
    mockModel = {
      findById: vi.fn().mockReturnValue({
        exec: vi.fn().mockResolvedValue({
          _id: 'agg-1',
          foo: 'old-foo',
        }),
      }),
    } as unknown as Model<MongoType>;
    typeConverter = vi.mocked({
      toAdapter: vi.fn(),
      toPersistence: vi.fn().mockImplementation(() => ({
        isModified: () => true,
        save: vi.fn().mockResolvedValue({
          _id: 'agg-1',
          foo: 'old-foo',
        }),
      })),
      toDomain: vi.fn().mockResolvedValue(
        new AggregateRootMock(
          vi.mocked({ id: 'agg-1', foo: 'old-foo' } as PropType),
          vi.mocked({} as typeof Passport)
        )
      ),
    }) as TypeConverter<MongoType, PropType, unknown, AggregateRootMock>;
    eventBus = vi.mocked({
      dispatch: vi.fn(),
      register: vi.fn(),
    }) as EventBus;
    integrationEventBus = vi.mocked({
      dispatch: vi.fn(),
      register: vi.fn(),
    }) as EventBus;
    repoInstance = new RepoMock(
      vi.mocked({}),
      mockModel,
      typeConverter,
      eventBus,
      session,
    );
    unitOfWork = new MongoUnitOfWork(
      eventBus,
      integrationEventBus,
      mockModel,
      typeConverter,
      mockRepoClass,
    );
    domainOperation = vi.fn();
    domainOperation.mockImplementation(async (repo: RepoMock) => {
      const aggregate = await repo.get('agg-1');
      aggregate.foo = 'new-foo';
      await repo.save(aggregate);
    });
    vi.spyOn(mongoose.connection, 'transaction').mockImplementation(
      async (cb: (session: ClientSession) => Promise<unknown>) => {
        await cb({} as ClientSession);
      },
    );
  });

  Scenario('Initializing the MongoUnitOfWork', ({ Given, When, Then }) => {
    Given('all dependencies are provided', () => {
      // Setup is done in BeforeEachScenario
    });
    When('MongoUnitOfWork is instantiated', () => {
      // Instantiation is done in BeforeEachScenario
    });
    Then('it stores and exposes the dependencies correctly', () => {
      expect(unitOfWork.model).toBe(mockModel);
      expect(unitOfWork.typeConverter).toBe(typeConverter);
      expect(unitOfWork.bus).toBe(eventBus);
      expect(unitOfWork.integrationEventBus).toBe(integrationEventBus);
      expect(unitOfWork.repoClass).toBe(mockRepoClass);
    });
  });

  Scenario('Domain operation with no events, completes successfully', ({ Given, When, Then }) => {
    Given('a domain operation that emits no domain or integration events', () => {
      repoInstance.getIntegrationEvents.mockReturnValue([]);
    });
    When('the operation completes successfully', async () => {
      await unitOfWork.withTransaction(Passport, domainOperation);
    });
    Then('the transaction is committed and no events are dispatched', () => {
      expect(domainOperation).toHaveBeenCalledWith(repoInstance);
      expect(integrationEventBus.dispatch).not.toHaveBeenCalled();
    });
  });

  Scenario('Domain operation with no events, throws error', ({ Given, When, Then }) => {
    let domainError: Error;
    Given('a domain operation that emits no domain or integration events', () => {
      repoInstance.getIntegrationEvents.mockReturnValue([]);
      domainError = new Error('Domain failure');
    });
    When('the operation throws an error', async () => {
      const failingOperation = vi.fn((_repo: RepoMock) => {
        throw domainError;
      });
      await expect(
        unitOfWork.withTransaction(Passport, failingOperation),
      ).rejects.toThrow(domainError);
    });
    Then('the transaction is rolled back and no events are dispatched', () => {
      expect(integrationEventBus.dispatch).not.toHaveBeenCalled();
    });
  });

  Scenario('Domain operation emits integration events, all dispatch succeed', ({ Given, When, Then }) => {
    let event1: TestEvent;
    let event2: TestEvent;
    Given('integration events are emitted during the domain operation', () => {
      event1 = new TestEvent('id');
      event1.payload = { foo: 'bar1' };
      event2 = new TestEvent('id');
      event2.payload = { foo: 'bar2' };
      repoInstance.getIntegrationEvents.mockReturnValue([event1, event2]);
    });
    When('the transaction completes successfully', async () => {
      (integrationEventBus.dispatch as Mock)
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(undefined);
      await unitOfWork.withTransaction(Passport, domainOperation);
    });
    Then('all integration events are dispatched after the transaction commits', () => {
      expect(integrationEventBus.dispatch).toHaveBeenCalledTimes(2);
      expect(integrationEventBus.dispatch).toHaveBeenNthCalledWith(
        1,
        event1.constructor,
        event1.payload,
      );
      expect(integrationEventBus.dispatch).toHaveBeenNthCalledWith(
        2,
        event2.constructor,
        event2.payload,
      );
    });
  });

  Scenario('Integration event dispatch fails', ({ Given, When, Then }) => {
    let event1: TestEvent;
    let event2: TestEvent;
    Given('integration events are emitted during the domain operation', () => {
      event1 = new TestEvent('id');
      event1.payload = { foo: 'bar1' };
      event2 = new TestEvent('id');
      event2.payload = { foo: 'bar2' };
      repoInstance.getIntegrationEvents.mockReturnValue([event1, event2]);
    });
    When('integration event dispatch fails', async () => {
      (integrationEventBus.dispatch as Mock)
        .mockRejectedValueOnce(new Error('fail1'))
        .mockResolvedValueOnce(undefined);
      await expect(
        unitOfWork.withTransaction(Passport, domainOperation),
      ).rejects.toThrow('fail1');
    });
    Then('the error from dispatch is propagated and the transaction is not rolled back by the unit of work', () => {
      expect(integrationEventBus.dispatch).toHaveBeenCalledTimes(1);
    });
  });

  Scenario('Multiple integration events are emitted and all succeed', ({ Given, When, Then }) => {
    let event1: TestEvent;
    let event2: TestEvent;
    Given('integration events are emitted during the domain operation', () => {
      event1 = new TestEvent('id');
      event1.payload = { foo: 'bar1' };
      event2 = new TestEvent('id');
      event2.payload = { foo: 'bar2' };
      repoInstance.getIntegrationEvents.mockReturnValue([event1, event2]);
    });
    When('multiple integration events are emitted and all succeed', async () => {
      (integrationEventBus.dispatch as Mock)
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(undefined);
      await unitOfWork.withTransaction(Passport, domainOperation);
    });
    Then('all are dispatched after the transaction', () => {
      expect(integrationEventBus.dispatch).toHaveBeenCalledTimes(2);
    });
  });

  Scenario('getInitializedUnitOfWork creates initialized unit of work', ({ Given, When, Then }) => {
    let initializedUow: InitializedUnitOfWork<PassportType, PropType, AggregateRootMock, RepoMock>;

    Given('a MongoUnitOfWork instance', () => {
      // Setup is done in BeforeEachScenario
    });

    When('getInitializedUnitOfWork is called with passport', () => {
      initializedUow = getInitializedUnitOfWork(unitOfWork as MongoUnitOfWork<MongoType, PropType, PassportType, AggregateRootMock, RepoMock>, Passport);
    });

    Then('it returns an InitializedUnitOfWork with required methods', () => {
      expect(initializedUow).toBeDefined();
      expect(typeof initializedUow.withTransaction).toBe('function');
      expect(typeof initializedUow.withScopedTransaction).toBe('function');
      expect(typeof initializedUow.withScopedTransactionById).toBe('function');
    });
  });

  Scenario('InitializedUnitOfWork withTransaction method', ({ Given, When, Then }) => {
    let initializedUow: InitializedUnitOfWork<PassportType, PropType, AggregateRootMock, RepoMock>;
    let transactionCallback: Mock<(repository: RepoMock) => Promise<void>>;

    Given('an initialized unit of work', () => {
      initializedUow = getInitializedUnitOfWork(unitOfWork as MongoUnitOfWork<MongoType, PropType, PassportType, AggregateRootMock, RepoMock>, Passport);
      transactionCallback = vi.fn();
    });

    When('withTransaction is called', async () => {
      await initializedUow.withTransaction(Passport, transactionCallback);
    });

    Then('it delegates to the underlying unit of work', () => {
      expect(transactionCallback).toHaveBeenCalledWith(repoInstance);
    });
  });

  Scenario('InitializedUnitOfWork withScopedTransaction method', ({ Given, When, Then }) => {
    let initializedUow: InitializedUnitOfWork<PassportType, PropType, AggregateRootMock, RepoMock>;
    let transactionCallback: Mock<(repository: RepoMock) => Promise<void>>;

    Given('an initialized unit of work', () => {
      initializedUow = getInitializedUnitOfWork(unitOfWork as MongoUnitOfWork<MongoType, PropType, PassportType, AggregateRootMock, RepoMock>, Passport);
      transactionCallback = vi.fn();
    });

    When('withScopedTransaction is called', async () => {
      await initializedUow.withScopedTransaction(transactionCallback);
    });

    Then('it delegates to the underlying unit of work with the stored passport', () => {
      expect(transactionCallback).toHaveBeenCalledWith(repoInstance);
    });
  });

  Scenario('InitializedUnitOfWork withScopedTransactionById with existing item', ({ Given, When, Then }) => {
    let initializedUow: InitializedUnitOfWork<PassportType, PropType, AggregateRootMock, RepoMock>;
    let result: AggregateRootMock;
    let transactionCallback: Mock<(repository: RepoMock) => Promise<void>>;

    Given('an initialized unit of work and an existing item', () => {
      initializedUow = getInitializedUnitOfWork(unitOfWork as MongoUnitOfWork<MongoType, PropType, PassportType, AggregateRootMock, RepoMock>, Passport);
      transactionCallback = vi.fn();
    });

    When('withScopedTransactionById is called with valid id', async () => {
      result = await initializedUow.withScopedTransactionById('agg-1', transactionCallback);
    });

    Then('it gets the item, executes the callback, saves and returns the item', () => {
      expect(transactionCallback).toHaveBeenCalledWith(repoInstance);
      expect(result).toBeDefined();
      expect(result.id).toBe('agg-1');
    });
  });

  Scenario('InitializedUnitOfWork withScopedTransactionById with non-existing item', ({ Given, When, Then }) => {
    let initializedUow: InitializedUnitOfWork<PassportType, PropType, AggregateRootMock, RepoMock>;

    Given('an initialized unit of work', () => {
      initializedUow = getInitializedUnitOfWork(unitOfWork as MongoUnitOfWork<MongoType, PropType, PassportType, AggregateRootMock, RepoMock>, Passport);
      // Mock repo.get to return null for non-existing item
      vi.spyOn(repoInstance, 'get').mockResolvedValue(null as unknown as AggregateRootMock);
    });

    When('withScopedTransactionById is called with invalid id', async () => {
      await expect(
        initializedUow.withScopedTransactionById('invalid-id', vi.fn())
      ).rejects.toThrow('item not found');
    });

    Then('it throws an error indicating item not found', () => {
      // Error is already checked in When step
    });
  });

  Scenario('InitializedUnitOfWork withScopedTransactionById callback throws error', ({ Given, When, Then }) => {
    let initializedUow: InitializedUnitOfWork<PassportType, PropType, AggregateRootMock, RepoMock>;
    let callbackError: Error;

    Given('an initialized unit of work and an existing item', () => {
      initializedUow = getInitializedUnitOfWork(unitOfWork as MongoUnitOfWork<MongoType, PropType, PassportType, AggregateRootMock, RepoMock>, Passport);
      callbackError = new Error('Callback failed');
    });

    When('withScopedTransactionById callback throws an error', async () => {
      const failingCallback = vi.fn(async () => {
        await Promise.resolve();
        throw callbackError;
      });
      await expect(
        initializedUow.withScopedTransactionById('agg-1', failingCallback)
      ).rejects.toThrow(callbackError);
    });

    Then('the error is propagated and transaction is rolled back', () => {
      // Error propagation is already checked in When step
    });
  });
});