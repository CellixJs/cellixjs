import { Domain, type DomainDataSource } from "@ocom/domain";
import type { ModelsContext } from "../index.ts";
import { DomainDataSourceImplementation } from "./domain/index.ts";
import { type ReadonlyDataSource, ReadonlyDataSourceImplementation } from "./readonly/index.ts";
import { PassportFactory } from '@ocom/domain/contexts/passport';

export type DataSources = {
    domainDataSource: DomainDataSource;
    readonlyDataSource: ReadonlyDataSource;
}

export type DataSourcesFactory = {
    withPassport: (passport: Domain.Passport) => DataSources,
    withSystemPassport: () => DataSources
}

export const DataSourcesFactoryImpl = (models: ModelsContext): DataSourcesFactory => {
    const withPassport = (passport: Domain.Passport): DataSources => {
        return {
            domainDataSource: DomainDataSourceImplementation(models, passport),
            readonlyDataSource: ReadonlyDataSourceImplementation(models, passport)
        };
    };

    const withSystemPassport = (): DataSources => {
        const systemPassport = PassportFactory.forSystem({
            canManageMembers: true,
            canManageEndUserRolesAndPermissions: true,
            canManageServices: true,
            isSystemAccount: true,
        });
        return {
            domainDataSource: DomainDataSourceImplementation(models, systemPassport),
            readonlyDataSource: ReadonlyDataSourceImplementation(models, systemPassport)
        };
    }

    return {
        withPassport: withPassport,
        withSystemPassport: withSystemPassport
    }
}
