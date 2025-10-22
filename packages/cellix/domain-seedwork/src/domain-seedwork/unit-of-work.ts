import type { AggregateRoot } from './aggregate-root.ts';
import type { DomainEntityProps } from './domain-entity.ts';
import type { Repository } from './repository.ts';

export interface UnitOfWork<
	PassportType,
	PropType extends DomainEntityProps,
	Root extends AggregateRoot<PropType, PassportType>,
	RepoType extends Repository<Root>,
> {
	withTransaction(
		passport: PassportType,
		func: (repository: RepoType) => Promise<void>,
	): Promise<void>;
}

export interface InitializedUnitOfWork<
    PassportType,
    PropType extends DomainEntityProps,
    Root extends AggregateRoot<PropType, PassportType>,
    RepoType extends Repository<Root>,
> extends UnitOfWork<PassportType, PropType, Root, RepoType> {
    withScopedTransaction(
        func: (repository: RepoType) => Promise<void>,
    ): Promise<void>;
    withScopedTransactionById(
        id: string,
        func: (repository: RepoType) => Promise<void>,
    ): Promise<Root>;
}
