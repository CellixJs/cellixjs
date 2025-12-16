import type { MongooseSeedwork } from '@cellix/mongoose-seedwork';
import { Persistence } from '@ocom/persistence';
import type { ServiceMongooseOptions } from '@ocom/service-mongoose';

const { COSMOSDB_DBNAME, COSMOSDB_CONNECTION_STRING, NODE_ENV } = process.env;

const isUsingCosmosDBEmulator =
	NODE_ENV === 'development' ||
	NODE_ENV === 'test';

export const mongooseConnectOptions: ServiceMongooseOptions = {
	tlsInsecure: isUsingCosmosDBEmulator, //only true for local development - required for Azure Cosmos DB emulator
	minPoolSize: 10, //default is zero
	// maxPoolSize: 100, //default is 100
	//keepAlive and keepAliveInitialDelay is deprecated as of Mongoose 7.2.0
	autoIndex: true, //default is true - there is debate on whether this should be true or false, leaving as true for now
	autoCreate: true, //default is true - there is debate on whether this should be true or false, leaving as true for now
	dbName: COSMOSDB_DBNAME, // need to throw an error if this is not set,
    debug: NODE_ENV !== 'production' // enables Mongoose logs for local development only, note this is not a mongoose ConnectOption field
};

export const mongooseConnectionString: string = COSMOSDB_CONNECTION_STRING ?? ''; // need to throw an error if this is not set

export const mongooseContextBuilder = (
	initializedService: MongooseSeedwork.MongooseContextFactory,
) => {
	return Persistence(initializedService);
};
