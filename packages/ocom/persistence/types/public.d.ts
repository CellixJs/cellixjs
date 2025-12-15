import type { Domain, DomainDataSource } from '@ocom/domain';

export interface CommunityReadRepository {
  getAll(options?: Record<string, unknown>): Promise<Domain.Contexts.Community.Community.CommunityEntityReference[]>;
  getById(id: string, options?: Record<string, unknown>): Promise<Domain.Contexts.Community.Community.CommunityEntityReference | null>;
  getByIdWithCreatedBy(id: string, options?: Record<string, unknown>): Promise<Domain.Contexts.Community.Community.CommunityEntityReference | null>;
  getByEndUserExternalId(endUserId: string): Promise<Domain.Contexts.Community.Community.CommunityEntityReference[]>;
}

export interface MemberReadRepository {
  getByCommunityId(communityId: string, options?: Record<string, unknown>): Promise<Domain.Contexts.Community.Member.MemberEntityReference[]>;
  getById(id: string, options?: Record<string, unknown>): Promise<Domain.Contexts.Community.Member.MemberEntityReference | null>;
  getByIdWithRole(id: string, options?: Record<string, unknown>): Promise<Domain.Contexts.Community.Member.MemberEntityReference | null>;
  getMembersForEndUserExternalId(externalId: string): Promise<Domain.Contexts.Community.Member.MemberEntityReference[]>;
  isAdmin(id: string): Promise<boolean>;
}

export interface EndUserReadRepository {
  getAll(options?: Record<string, unknown>): Promise<Domain.Contexts.User.EndUser.EndUserEntityReference[]>;
  getById(id: string, options?: Record<string, unknown>): Promise<Domain.Contexts.User.EndUser.EndUserEntityReference | null>;
  getByName(displayName: string, options?: Record<string, unknown>): Promise<Domain.Contexts.User.EndUser.EndUserEntityReference[]>;
  getByExternalId(externalId: string, options?: Record<string, unknown>): Promise<Domain.Contexts.User.EndUser.EndUserEntityReference | null>;
}

export interface ReadonlyCommunityDataSource {
  Community: {
    CommunityReadRepo: CommunityReadRepository;
  };
  Member: {
    MemberReadRepo: MemberReadRepository;
  };
}

export interface ReadonlyUserDataSource {
  EndUser: {
    EndUserReadRepo: EndUserReadRepository;
  };
}

export interface ReadonlyDataSource {
  Community: ReadonlyCommunityDataSource;
  User: ReadonlyUserDataSource;
}

export interface DataSources {
  domainDataSource: DomainDataSource;
  readonlyDataSource: ReadonlyDataSource;
}

export interface DataSourcesFactory {
  withPassport(passport: Domain.Passport): DataSources;
  withSystemPassport(): DataSources;
}

export interface MongooseContextFactoryLike {
  service: {
    models: Record<string, unknown>;
    model: (name: string, schema: unknown, collection?: unknown, options?: unknown) => unknown;
  };
}

export type Persistence = (initializedService: MongooseContextFactoryLike) => DataSourcesFactory;
export declare const Persistence: Persistence;