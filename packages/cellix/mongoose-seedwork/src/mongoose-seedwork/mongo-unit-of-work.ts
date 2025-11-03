import mongoose, { type ClientSession, type Model } from 'mongoose';
import { MongoRepositoryBase } from './mongo-repository.ts';
import type { DomainSeedwork } from '@cellix/domain-seedwork';
import type { Base } from './base.ts';

export class MongoUnitOfWork<
	MongoType extends Base,
	PropType extends DomainSeedwork.DomainEntityProps,
	PassportType,
	DomainType extends DomainSeedwork.AggregateRoot<PropType, PassportType>,
	RepoType extends MongoRepositoryBase<
		MongoType,
		PropType,
		PassportType,
		DomainType
	>,
> implements
		DomainSeedwork.UnitOfWork<PassportType, PropType, DomainType, RepoType>
{
	public readonly model: Model<MongoType>;
	public readonly typeConverter: DomainSeedwork.TypeConverter<
		MongoType,
		PropType,
		PassportType,
		DomainType
	>;
	public readonly bus: DomainSeedwork.EventBus;
	public readonly integrationEventBus: DomainSeedwork.EventBus;
	// protected passport: PassportType;
	public readonly repoClass: new (
		passport: PassportType,
		model: Model<MongoType>,
		typeConverter: DomainSeedwork.TypeConverter<
			MongoType,
			PropType,
			PassportType,
			DomainType
		>,
		bus: DomainSeedwork.EventBus,
		session: ClientSession,
	) => RepoType;

	constructor(
		//  passport: PassportType,
		bus: DomainSeedwork.EventBus,
		integrationEventBus: DomainSeedwork.EventBus,
		model: Model<MongoType>,
		typeConverter: DomainSeedwork.TypeConverter<
			MongoType,
			PropType,
			PassportType,
			DomainType
		>,
		repoClass: new (
			passport: PassportType,
			model: Model<MongoType>,
			typeConverter: DomainSeedwork.TypeConverter<
				MongoType,
				PropType,
				PassportType,
				DomainType
			>,
			bus: DomainSeedwork.EventBus,
			session: ClientSession,
		) => RepoType,
	) {
		//  this.passport = passport;
		this.model = model;
		this.typeConverter = typeConverter;
		this.bus = bus;
		this.integrationEventBus = integrationEventBus;
		this.repoClass = repoClass;
	}

	async withTransaction(
		passport: PassportType,
		func: (repository: RepoType) => Promise<void>,
	): Promise<void> {
		let repoEvents: ReadonlyArray<DomainSeedwork.CustomDomainEvent<unknown>> =
			[]; //todo: can we make this an arry of CustomDomainEvents?

		await mongoose.connection.transaction(async (session: ClientSession) => {
			console.log('transaction');
			const repo = MongoRepositoryBase.create(
				passport,
				this.model,
				this.typeConverter,
				this.bus,
				session,
				this.repoClass,
			);
			console.log('repo created');
			try {
				await func(repo);
				// await console.log('func done');
			} catch (e) {
				console.log('func failed');
				console.log(e);
				throw e;
			}
			repoEvents = repo.getIntegrationEvents();
		});
		console.log(`${repoEvents.length} integration events`);
		//Send integration events after transaction is completed
		for (const event of repoEvents) {
			await this.integrationEventBus.dispatch(
				event.constructor as new (
					aggregateId: string,
				) => typeof event,
				event.payload,
			);
			console.log(
				`dispatch integration event ${event.constructor.name} with payload ${JSON.stringify(event.payload)}`,
			);
		}
	}
}

export function getInitializedUnitOfWork<
	MongoType extends Base,
	PropType extends DomainSeedwork.DomainEntityProps,
	PassportType,
	DomainType extends DomainSeedwork.AggregateRoot<PropType, PassportType>,
	RepoType extends MongoRepositoryBase<
		MongoType,
		PropType,
		PassportType,
		DomainType
	>,
>(
	unitOfWork: MongoUnitOfWork<
		MongoType,
		PropType,
		PassportType,
		DomainType,
		RepoType
	>,
	passport: PassportType,
): DomainSeedwork.InitializedUnitOfWork<
        PassportType,
        PropType,
        DomainType,
        RepoType> {
	const withScopedTransaction = async (
		callback: (repo: RepoType) => Promise<void>,
	): Promise<void> => {
		return await unitOfWork.withTransaction(passport, callback);
	};

	const withScopedTransactionById = async(
		id: string,
		callback: (repo: RepoType) => Promise<void>,
	): Promise<DomainType> => {
		let itemToReturn: DomainType | undefined;
		await unitOfWork.withTransaction(passport, async (repo) => {
			const domainObject = await repo.get(id);
			if (!domainObject) {
				throw new Error('item not found');
			}
			await callback(repo);
			itemToReturn = await repo.save(domainObject);
		});
        if (!itemToReturn) { throw new Error('item not found')};
		return itemToReturn;
	};

    const withTransaction = async (
		passport: PassportType,
		func: (repository: RepoType) => Promise<void>,
	): Promise<void> => {
        return await unitOfWork.withTransaction(passport, func);
	};

	return {
		withTransaction,
		withScopedTransaction,
		withScopedTransactionById,
	};
}
