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
	 	// Use a type guard to ensure correct type without assertion
	 	if (this.isMongooseModelType(mongoType)) {
	 		return new this.adapter(mongoType);
	 	}
	 	throw new Error('Invalid type passed to toAdapter');
	 }

	 private isMongooseModelType(obj: unknown): obj is MongooseModelType {
	 	// Basic type guard: check for a property unique to MongooseModelType
	 	// You may need to refine this based on your actual model
	 	return typeof obj === 'object' && obj !== null && 'constructor' in obj;
	 }
}
