import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { expect, vi } from 'vitest';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Mongoose, ConnectOptions } from 'mongoose';

// Use the vi.mock factory pattern to avoid hoisting issues with top-level variables
vi.mock('mongoose', () => {
	const connect = vi.fn();
	// We'll set the resolved value of connect in BeforeEachScenario
	return {
		default: {
			connect,
		},
		connect,
	};
});

import { ServiceMongoose } from './index.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feature = await loadFeature(
	path.resolve(__dirname, 'features/service-mongoose.feature'),
);

describeFeature(
	feature,
	({ Scenario, BeforeEachScenario, AfterEachScenario }) => {
		let uri: string;
		let options: ConnectOptions;
		let service: ServiceMongoose;
		let mockMongooseInstance: Mongoose;
		let logSpy: ReturnType<typeof vi.spyOn>;
		let connectMock: ReturnType<typeof vi.fn>;
		let disconnectMock: ReturnType<typeof vi.fn>;

		BeforeEachScenario(async () => {
			uri = 'mongodb://localhost:27017/testdb';
			options = { user: 'test', pass: 'test' };
			// Get the actual mocked connect function from the mocked module
			const mongooseModule = await import('mongoose');
			connectMock = mongooseModule.connect as ReturnType<typeof vi.fn>;
			disconnectMock = vi.fn().mockResolvedValue(undefined);
			mockMongooseInstance = {
				disconnect: disconnectMock,
			} as unknown as Mongoose;
			connectMock.mockClear();
			disconnectMock.mockClear();
			connectMock.mockResolvedValue(mockMongooseInstance);
			logSpy = vi.spyOn(console, 'log').mockImplementation(() => {
				/* no-op */
			});
		});

		Scenario(
			'Initializing the Mongoose Service with a valid URI',
			({ Given, When, Then }) => {
				Given('a valid MongoDB URI and options', () => {
					// Already set in BeforeEachScenario
				});
				When(
					'the mongoose service is constructed with a valid URI and options',
					() => {
						service = new ServiceMongoose(uri, options);
					},
				);
				Then('it should initialize the uri and options properties', () => {
					// biome-ignore lint:useLiteralKeys
					expect(service['uri']).toBe(uri);
					// biome-ignore lint:useLiteralKeys
					expect(service['options']).toBe(options);
				});
			},
		);

		Scenario(
			'Initializing the Mongoose Service with a valid URI and no options',
			({ Given, When, Then }) => {
				Given('a valid MongoDB URI and no options', () => {
					uri = 'mongodb://localhost:27017/testdb';
				});
				When(
					'the mongoose service is constructed with a valid URI and no options',
					() => {
						service = new ServiceMongoose(uri);
					},
				);
				Then(
					'it should initialize the uri property and use Mongoose default options',
					() => {
                        // biome-ignore lint:useLiteralKeys
						expect(service['uri']).toBe(uri);
                        // biome-ignore lint:useLiteralKeys
						expect(service['options']).toEqual({});
					},
				);
			},
		);

		Scenario(
			'Initializing the Mongoose Service with an empty URI',
			({ Given, When, Then }) => {
				Given('an empty MongoDB URI', () => {
					uri = '';
				});
				When('the mongoose service is constructed with an empty URI', () => {
					// nothing to do here
				});
				Then(
					'it should throw an error indicating the MongoDB uri is required',
					() => {
						expect(() => new ServiceMongoose(uri)).toThrow(
							'MongoDB uri is required',
						);
					},
				);
			},
		);

		Scenario('Starting up the service', ({ Given, When, Then }) => {
			Given('a mongoose service instance with a valid URI', () => {
				service = new ServiceMongoose(uri, options);
			});
			When('the service is started', async () => {
				await service.startUp();
			});
			Then('it should connect to MongoDB and set serviceInternal', () => {
				expect(connectMock).toHaveBeenCalledWith(uri, options);
                // biome-ignore lint:useLiteralKeys
				expect(service['serviceInternal']).toBe(mockMongooseInstance);
			});
		});

		Scenario(
			'Shutting down the service when started',
			({ Given, When, Then }) => {
				Given('a started mongoose service instance', async () => {
					service = new ServiceMongoose(uri, options);
					await service.startUp();
				});
				When('the service is shutdown', async () => {
					await service.shutDown();
				});
				Then(
					'it should disconnect from MongoDB and log that the service stopped',
					() => {
						expect(disconnectMock).toHaveBeenCalled();
						expect(logSpy).toHaveBeenCalledWith('ServiceMongoose stopped');
					},
				);
			},
		);

		Scenario(
			'Shutting down the service when not started',
			({ Given, When, Then }) => {
				Given('a mongoose service instance that has not been started', () => {
					service = new ServiceMongoose(uri, options);
				});
				When('the service is shutdown', async () => {
					// nothing to do here
				});
				Then(
					'it should throw an error indicating shutdown cannot proceed',
					async () => {
						await expect(service.shutDown()).rejects.toThrow(
							'ServiceMongoose is not started - shutdown cannot proceed',
						);
					},
				);
			},
		);

		Scenario(
			'Accessing the service property when started',
			({ Given, When, Then }) => {
				Given('a started mongoose service instance', async () => {
					service = new ServiceMongoose(uri, options);
					await service.startUp();
				});
				When('the service property is accessed', () => {
					// nothing to do here
				});
				Then('it should return the internal Mongoose instance', () => {
					expect(service.service).toBe(mockMongooseInstance);
				});
			},
		);

		Scenario(
			'Accessing the service property when not started',
			({ Given, When, Then }) => {
				Given('a mongoose service instance that has not been started', () => {
					service = new ServiceMongoose(uri, options);
				});
				When('the service property is accessed', () => {
					// nothing to do here
				});
				Then(
					'it should throw an error indicating the service is not started',
					() => {
						expect(() => service.service).toThrow(
							'ServiceMongoose is not started - cannot access service',
						);
					},
				);
			},
		);

		AfterEachScenario(() => {
			logSpy.mockRestore();
		});
	},
);
