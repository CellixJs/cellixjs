import type { AggregateRoot } from '@cellix/domain-seedwork/aggregate-root';
import type { TypeConverter } from '@cellix/domain-seedwork/type-converter';
import type { Base } from './base.ts';
import type { MongooseDomainAdapterType } from './mongo-domain-adapter.ts';

export abstract class MongoTypeConverter<
	MongooseModelType extends Base,
	DomainPropInterface extends MongooseDomainAdapterType<MongooseModelType>,
	PassportType,
	DomainType extends AggregateRoot<
		DomainPropInterface,
		PassportType
	>,
> implements
		TypeConverter<
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
		// biome-ignore lint/plugin/no-type-assertion: At this point, mongoType must be MongooseModelType since it's not an instance of domainObject
		return new this.adapter(mongoType as MongooseModelType);
	}
}
