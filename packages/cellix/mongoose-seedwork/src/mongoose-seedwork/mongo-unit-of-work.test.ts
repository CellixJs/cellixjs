import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { expect, vi, type Mock} from 'vitest';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { ClientSession, Model } from 'mongoose';
import mongoose from 'mongoose';
import { DomainSeedwork } from '@cellix/domain-seedwork';
import type { Base } from './index.js';
import { MongoUnitOfWork } from './mongo-unit-of-work.js';
import { MongoRepositoryBase } from './mongo-repository.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feature = await loadFeature(
  path.resolve(__dirname, 'features/mongo-unit-of-work.feature')
);

class AggregateRootMock extends DomainSeedwork.AggregateRoot<PropType, unknown> {
  override getIntegrationEvents = vi.fn(() => []);
  get foo(): string { return this.props.foo; }
  set foo(foo: string) { this.props.foo = foo; }
  get createdAt(): Date { return this.props.createdAt; }
}
interface MongoType extends Base { foo: string; }
type PropType = DomainSeedwork.DomainEntityProps & {
  foo: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly schemaVersion: string;
};
class RepoMock extends MongoRepositoryBase<MongoType, PropType, unknown, AggregateRootMock> {
  override getIntegrationEvents = vi.fn(() => []);
}

class TestEvent extends DomainSeedwork.CustomDomainEventImpl<{ foo: string }> {}

vi.mock('mongoose', async () => {
  const original = await vi.importActual<typeof import('mongoose')>('mongoose');
  return {
    ...original,
    connection: {
      transaction: vi.fn(),
    },
  };
});

describeFeature(feature, ({ Scenario, BeforeEachScenario }) => {
  let unitOfWork: MongoUnitOfWork<MongoType, PropType, unknown, AggregateRootMock, RepoMock>;
  let repoInstance: RepoMock;
  let eventBus: DomainSeedwork.EventBus;
  let integrationEventBus: DomainSeedwork.EventBus;
  let session: ClientSession;
  let mockModel: Model<MongoType>;
  let typeConverter: DomainSeedwork.TypeConverter<MongoType, PropType, unknown, AggregateRootMock>;
  const Passport = {};
  const mockRepoClass = vi.fn((_passport, _model, _typeConverter, _bus, _session): RepoMock => repoInstance);
  let domainOperation: ReturnType<typeof vi.fn>;

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
          foo: 'old`-foo',
        }),
      })),
      toDomain: vi.fn().mockResolvedValue(
        new AggregateRootMock(
          vi.mocked({ id: 'agg-1', foo: 'old-foo' } as PropType),
          vi.mocked({} as unknown)
        )
      ),
    }) as DomainSeedwork.TypeConverter<MongoType, PropType, unknown, AggregateRootMock>;
    eventBus = vi.mocked({
      dispatch: vi.fn(),
      register: vi.fn(),
    }) as DomainSeedwork.EventBus;
    integrationEventBus = vi.mocked({
      dispatch: vi.fn(),
      register: vi.fn(),
    }) as DomainSeedwork.EventBus;
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
    domainOperation = vi.fn(async (repo: RepoMock) => {
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
      repoInstance.getIntegrationEvents = vi.fn(() => []);
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
      repoInstance.getIntegrationEvents = vi.fn(() => []);
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
      repoInstance.getIntegrationEvents = vi.fn(() => [event1, event2]);
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
      repoInstance.getIntegrationEvents = vi.fn(() => [event1, event2]);
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
      repoInstance.getIntegrationEvents = vi.fn(() => [event1, event2]);
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
});