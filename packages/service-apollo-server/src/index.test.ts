import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { expect, vi } from 'vitest';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { ApolloServer } from '@apollo/server';
import { makeExecutableSchema } from '@graphql-tools/schema';

// Use the vi.mock factory pattern to avoid hoisting issues with top-level variables
vi.mock('@apollo/server', () => {
	const mockStart = vi.fn();
	const mockStop = vi.fn();
	const mockServer = {
		startInBackgroundHandlingStartupErrorsByLoggingAndFailingAllRequests: mockStart,
		stop: mockStop,
	};

	const ApolloServerConstructor = vi.fn().mockImplementation(() => mockServer);
	
	return {
		ApolloServer: ApolloServerConstructor,
	};
});

import { ServiceApolloServer, type ServiceApolloServerOptions } from './index.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feature = await loadFeature(
	path.resolve(__dirname, 'features/service-apollo-server.feature'),
);

describeFeature(
	feature,
	({ Scenario, BeforeEachScenario, AfterEachScenario }) => {
		let options: ServiceApolloServerOptions;
		let service: ServiceApolloServer;
		let mockApolloServerInstance: ApolloServer;
		let logSpy: ReturnType<typeof vi.spyOn>;
		let apolloServerConstructorMock: ReturnType<typeof vi.fn>;
		let startMock: ReturnType<typeof vi.fn>;
		let stopMock: ReturnType<typeof vi.fn>;

		BeforeEachScenario(async () => {
			// Create a simple test schema
			const schema = makeExecutableSchema({
				typeDefs: `
					type Query {
						hello: String
					}
				`,
				resolvers: {
					Query: {
						hello: () => 'Hello world!',
					},
				},
			});

			options = {
				schema,
				cors: {
					origin: true,
					credentials: true,
				},
				allowBatchedHttpRequests: true,
			};

			// Get the mocked ApolloServer constructor and methods
			const apolloModule = await import('@apollo/server');
			apolloServerConstructorMock = apolloModule.ApolloServer as ReturnType<typeof vi.fn>;
			
			startMock = vi.fn().mockResolvedValue(undefined);
			stopMock = vi.fn().mockResolvedValue(undefined);
			
			mockApolloServerInstance = {
				startInBackgroundHandlingStartupErrorsByLoggingAndFailingAllRequests: startMock,
				stop: stopMock,
			} as unknown as ApolloServer;

			apolloServerConstructorMock.mockClear();
			startMock.mockClear();
			stopMock.mockClear();
			apolloServerConstructorMock.mockReturnValue(mockApolloServerInstance);

			logSpy = vi.spyOn(console, 'log').mockImplementation(() => {
				// mock
			});
		});

		Scenario(
			'Creating a new Apollo Server service instance with valid options',
			({ Given, When, Then }) => {
				Given('valid Apollo Server options', () => {
					// options are set up in BeforeEachScenario
				});
				When('a new service is created', () => {
					service = new ServiceApolloServer(options);
				});
				Then('it should be created successfully', () => {
					expect(service).toBeInstanceOf(ServiceApolloServer);
				});
			},
		);

		Scenario(
			'Creating a new Apollo Server service instance with missing schema',
			({ Given, When, Then }) => {
				Given('Apollo Server options without schema', () => {
					options = {
						...options,
						// biome-ignore lint/suspicious/noExplicitAny: needed for testing invalid input
						schema: undefined as any,
					};
				});
				When('attempting to create a new service', () => {
					// Test happens in Then block
				});
				Then('it should throw an error about missing schema', () => {
					expect(() => new ServiceApolloServer(options)).toThrow(
						'GraphQL schema is required for Apollo Server service',
					);
				});
			},
		);

		Scenario(
			'Starting up the Apollo Server service',
			({ Given, When, Then }) => {
				Given('an Apollo Server service instance', () => {
					service = new ServiceApolloServer(options);
				});
				When('the service is started up', async () => {
					await service.startUp();
				});
				Then(
					'it should create and start the Apollo Server with correct options',
					() => {
						expect(apolloServerConstructorMock).toHaveBeenCalledWith({
							schema: options.schema,
							cors: options.cors,
							allowBatchedHttpRequests: options.allowBatchedHttpRequests,
						});
						expect(startMock).toHaveBeenCalled();
						expect(logSpy).toHaveBeenCalledWith('ServiceApolloServer started');
					},
				);
			},
		);

		Scenario(
			'Shutting down the Apollo Server service when started',
			({ Given, When, Then }) => {
				Given('a started Apollo Server service instance', async () => {
					service = new ServiceApolloServer(options);
					await service.startUp();
				});
				When('the service is shutdown', async () => {
					await service.shutDown();
				});
				Then(
					'it should stop the Apollo Server and log that the service stopped',
					() => {
						expect(stopMock).toHaveBeenCalled();
						expect(logSpy).toHaveBeenCalledWith('ServiceApolloServer stopped');
					},
				);
			},
		);

		Scenario(
			'Shutting down the Apollo Server service when not started',
			({ Given, When, Then }) => {
				Given('an Apollo Server service instance that has not been started', () => {
					service = new ServiceApolloServer(options);
				});
				When('the service is shutdown', async () => {
					// nothing to do here
				});
				Then(
					'it should throw an error indicating shutdown cannot proceed',
					async () => {
						await expect(service.shutDown()).rejects.toThrow(
							'ServiceApolloServer is not started - shutdown cannot proceed',
						);
					},
				);
			},
		);

		Scenario(
			'Accessing the server property when started',
			({ Given, When, Then }) => {
				Given('a started Apollo Server service instance', async () => {
					service = new ServiceApolloServer(options);
					await service.startUp();
				});
				When('the server property is accessed', () => {
					// nothing to do here
				});
				Then('it should return the internal Apollo Server instance', () => {
					expect(service.server).toBe(mockApolloServerInstance);
				});
			},
		);

		Scenario(
			'Accessing the server property when not started',
			({ Given, When, Then }) => {
				Given('an Apollo Server service instance that has not been started', () => {
					service = new ServiceApolloServer(options);
				});
				When('the server property is accessed', () => {
					// nothing to do here
				});
				Then(
					'it should throw an error indicating the service is not started',
					() => {
						expect(() => service.server).toThrow(
							'ServiceApolloServer is not started - cannot access server',
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