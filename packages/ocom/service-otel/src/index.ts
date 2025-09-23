import * as opentelemetry from '@opentelemetry/sdk-node';

import {
	ATTR_SERVICE_NAME,
	ATTR_SERVICE_VERSION,
} from '@opentelemetry/semantic-conventions';

import type { SyncServiceBase } from '@cellix/api-services-spec';
import { OtelBuilder } from './otel-builder.ts';

// biome-ignore lint:noEmptyInterface
export interface OtelContext {}

export interface OtelConfig {
	/* Enable this flag to export telemetry to the console, default = false */
	exportToConsole?: boolean;

	/* Enable this flag to use simple processors instead of batch processors, default = false */
	/* Simple processors are useful for debugging, but not recommended for production use */
	useSimpleProcessors?: boolean;
}

export class ServiceOtel implements SyncServiceBase<void> {
	private readonly sdk: opentelemetry.NodeSDK;

	constructor(config: OtelConfig) {
		const otelBuilder = new OtelBuilder();
		const exporters = otelBuilder.buildExporters(config.exportToConsole);
		const processors = otelBuilder.buildProcessors(
			config.useSimpleProcessors,
			exporters,
		);
		const metricReader = otelBuilder.buildMetricReader(exporters);
		const instrumentations = otelBuilder.buildInstrumentations();

		const sdkConfig: Partial<opentelemetry.NodeSDKConfiguration> = {
			...processors,
			metricReader: metricReader,
			instrumentations: instrumentations,

			resource: opentelemetry.resources.Resource.default().merge(
				new opentelemetry.resources.Resource({
					[ATTR_SERVICE_NAME]: 'Cellix Demo',
					[ATTR_SERVICE_VERSION]: '1.0.0',
				}),
			),
            sampler: otelBuilder.buildSampler()
		};
		this.sdk = new opentelemetry.NodeSDK(sdkConfig);
	}

	public startUp() {
		this.sdk.start();
        console.log('ServiceOtel started');
	}

	public shutDown() {
		void this.sdk.shutdown();
		console.log('ServiceOtel stopped');
	}
}
