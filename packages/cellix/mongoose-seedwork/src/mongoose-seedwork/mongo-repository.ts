import type { DomainEntityProps } from '@cellix/domain-seedwork/domain-entity';
import type { AggregateRoot } from '@cellix/domain-seedwork/aggregate-root';
import { NotFoundError } from '@cellix/domain-seedwork/repository';
import type { Repository } from '@cellix/domain-seedwork/repository';
import type { TypeConverter } from '@cellix/domain-seedwork/type-converter';
import type { EventBus } from '@cellix/domain-seedwork/event-bus';
import type { CustomDomainEvent } from '@cellix/domain-seedwork/domain-event';
import type { ClientSession, Model } from 'mongoose';
import type { Base } from './base.ts';

export abstract class MongoRepositoryBase<
	MongoType extends Base,
	PropType extends DomainEntityProps,
	PassportType,
	DomainType extends AggregateRoot<PropType, PassportType>,
> implements Repository<DomainType>
{
	protected itemsInTransaction: DomainType[] = [];
	protected passport: PassportType;
	protected model: Model<MongoType>;
	public typeConverter: TypeConverter<
		MongoType,
		PropType,
		PassportType,
		DomainType
	>;
	protected bus: EventBus;
	protected session: ClientSession;

	public constructor(
		passport: PassportType,
		model: Model<MongoType>,
		typeConverter: TypeConverter<
			MongoType,
			PropType,
			PassportType,
			DomainType
		>,
		eventBus: EventBus,
		session: ClientSession,
	) {
		this.passport = passport;
		this.model = model;
		this.typeConverter = typeConverter;
		this.bus = eventBus;
		this.session = session;
	}

	async get(id: string): Promise<DomainType> {
		const item = await this.model.findById(id).exec();
		if (!item) {
			throw new NotFoundError(`Item with id ${id} not found`);
		}
		return this.typeConverter.toDomain(item, this.passport);
	}

	async save(item: DomainType): Promise<DomainType> {
		item.onSave(this.typeConverter.toPersistence(item).isModified());

		console.log('saving item');
		for (const event of item.getDomainEvents()) {
			console.log(`Repo dispatching DomainEvent : ${JSON.stringify(event)}`);
			// [NN] [ESLINT] will come back to this with refactoring and unit tests to implement similar to QueueSenderApi<T>
			await this.bus.dispatch(
				event.constructor as new (aggregateId: string) => typeof event,
				event.payload,
			);
		}
		item.clearDomainEvents();
		this.itemsInTransaction.push(item);
		try {
			if (item.isDeleted) {
                console.log('deleting item id', item.id);
				await this.model
					.deleteOne({ _id: item.id }, { session: this.session })
					.exec();
				return item;
			} else {
				console.log('saving item id', item.id);
				const mongoObj = this.typeConverter.toPersistence(item);
				return this.typeConverter.toDomain(
					await mongoObj.save({ session: this.session }),
					this.passport,
				);
			}
		} catch (error) {
			console.log(`Error saving item : ${String(error)}`);
			throw error;
		}
	}

	getIntegrationEvents(): ReadonlyArray<
		CustomDomainEvent<unknown>
	> {
		const integrationEventsGroup = this.itemsInTransaction.map((item) => {
			const integrationEvents = item.getIntegrationEvents();
			item.clearIntegrationEvents();
			return integrationEvents;
		});
		return integrationEventsGroup.reduce((acc, curr) => acc.concat(curr), []);
	}

	static create<
		MongoType extends Base,
		PropType extends DomainEntityProps,
		PassportType,
		DomainType extends AggregateRoot<PropType, PassportType>,
		RepoType extends MongoRepositoryBase<
			MongoType,
			PropType,
			PassportType,
			DomainType
		>,
	>(
		passport: PassportType,
		model: Model<MongoType>,
		typeConverter: TypeConverter<
			MongoType,
			PropType,
			PassportType,
			DomainType
		>,
		bus: EventBus,
		session: ClientSession,
		repoClass: new (
			passport: PassportType,
			model: Model<MongoType>,
			typeConverter: TypeConverter<
				MongoType,
				PropType,
				PassportType,
				DomainType
			>,
			bus: EventBus,
			session: ClientSession,
		) => RepoType,
	): RepoType {
		return new repoClass(passport, model, typeConverter, bus, session);
	}
}
