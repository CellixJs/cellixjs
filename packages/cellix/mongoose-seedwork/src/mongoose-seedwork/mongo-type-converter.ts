import type { Base } from './base.ts';
import type { DomainSeedwork } from '@cellix/domain-seedwork';
import type { MongooseDomainAdapterType } from './mongo-domain-adapter.ts';

export abstract class MongoTypeConverter<
	MongooseModelType extends Base,
	DomainPropInterface extends MongooseDomainAdapterType<MongooseModelType>,
	PassportType,
	DomainType extends DomainSeedwork.AggregateRoot<
		DomainPropInterface,
		PassportType
	>,
> implements
		DomainSeedwork.TypeConverter<
			MongooseModelType,
			DomainPropInterface,
			PassportType,
			DomainType
		>
{
	private readonly adapter: new (
		args: MongooseModelType,
	) => DomainPropInterface;
	private readonly domainObject: new (
		args: DomainPropInterface,
		passport: PassportType,
	) => DomainType;

	constructor(
		adapter: new (args: MongooseModelType) => DomainPropInterface,
		domainObject: new (
			args: DomainPropInterface,
			passport: PassportType,
		) => DomainType,
	) {
		this.adapter = adapter;
		this.domainObject = domainObject;
	}

	toDomain(mongoType: MongooseModelType, passport: PassportType) {
		return new this.domainObject(this.toAdapter(mongoType), passport);
	}

	toPersistence(domainType: DomainType): MongooseModelType {
		return domainType.props.doc;
	}

	toAdapter(mongoType: MongooseModelType | DomainType): DomainPropInterface {
		if (mongoType instanceof this.domainObject) {
			return mongoType.props;
		}
		return new this.adapter(mongoType as MongooseModelType);
	}
}
