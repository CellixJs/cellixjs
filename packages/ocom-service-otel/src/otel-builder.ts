import type { NodeSDKConfiguration } from '@opentelemetry/sdk-node';
import {
	AzureMonitorTraceExporter,
	AzureMonitorMetricExporter,
	AzureMonitorLogExporter,
} from '@azure/monitor-opentelemetry-exporter';
import {
	BatchLogRecordProcessor,
	SimpleLogRecordProcessor,
	ConsoleLogRecordExporter,
} from '@opentelemetry/sdk-logs';
import {
	BatchSpanProcessor,
	SimpleSpanProcessor,
	ConsoleSpanExporter,
    type Sampler,
    SamplingDecision,
    ParentBasedSampler,
    AlwaysOnSampler,
} from '@opentelemetry/sdk-trace-node';
import {
	PeriodicExportingMetricReader,
	ConsoleMetricExporter,
} from '@opentelemetry/sdk-metrics';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import { DataloaderInstrumentation } from '@opentelemetry/instrumentation-dataloader';
import { GraphQLInstrumentation } from '@opentelemetry/instrumentation-graphql';
import azureOtel from '@azure/functions-opentelemetry-instrumentation';
import { MongooseInstrumentation } from '@opentelemetry/instrumentation-mongoose';

import { httpInstrumentationConfig } from './http-config.js';
import type { Attributes, Context, Link, SpanKind } from '@opentelemetry/api';
const { AzureFunctionsInstrumentation } = azureOtel; //Need to use destructuring to access AzureFunctionsInstrumentation (CommonJS module)

interface Exporters {
	traceExporter: AzureMonitorTraceExporter | ConsoleSpanExporter;
	metricExporter: AzureMonitorMetricExporter | ConsoleMetricExporter;
	logExporter: AzureMonitorLogExporter | ConsoleLogRecordExporter;
}

export class OtelBuilder {
	public buildExporters(exportToConsole: boolean = false): Exporters {
		if (exportToConsole) {
			return {
				traceExporter: new ConsoleSpanExporter(),
				metricExporter: new ConsoleMetricExporter(),
				logExporter: new ConsoleLogRecordExporter(),
			};
		} else {
            //biome-ignore lint:useLiteralKeys
			if (!process.env['APPLICATIONINSIGHTS_CONNECTION_STRING']) {
				throw new Error(
					'Missing required environment variable: APPLICATIONINSIGHTS_CONNECTION_STRING',
				);
			}
			return {
				traceExporter: new AzureMonitorTraceExporter({
					connectionString:
                        //biome-ignore lint:useLiteralKeys
						process.env['APPLICATIONINSIGHTS_CONNECTION_STRING'],
				}),
				metricExporter: new AzureMonitorMetricExporter({
					connectionString:
                        //biome-ignore lint:useLiteralKeys
						process.env['APPLICATIONINSIGHTS_CONNECTION_STRING'],
				}),
				logExporter: new AzureMonitorLogExporter({
					connectionString:
                        //biome-ignore lint:useLiteralKeys
						process.env['APPLICATIONINSIGHTS_CONNECTION_STRING'],
				}),
			};
		}
	}

	public buildProcessors(
		useSimpleProcessors: boolean = false,
		exporters: Exporters,
	): Partial<NodeSDKConfiguration> {
		if (useSimpleProcessors) {
			return {
				spanProcessors: [new SimpleSpanProcessor(exporters.traceExporter)],
				logRecordProcessors: [
					new SimpleLogRecordProcessor(exporters.logExporter),
				],
			};
		} else {
			const EXPORT_TIMEOUT_MILLIS = 15000;
			const MAX_QUEUE_SIZE = 1000;
			return {
				spanProcessors: [
					new BatchSpanProcessor(exporters.traceExporter, {
						exportTimeoutMillis: EXPORT_TIMEOUT_MILLIS,
						maxQueueSize: MAX_QUEUE_SIZE,
					}),
				],
				logRecordProcessors: [
					new BatchLogRecordProcessor(exporters.logExporter, {
						exportTimeoutMillis: EXPORT_TIMEOUT_MILLIS,
						maxQueueSize: MAX_QUEUE_SIZE,
					}),
				],
			};
		}
	}

	public buildMetricReader(exporters: Exporters) {
		const EXPORT_INTERVAL_MILLIS = 60000;
		return new PeriodicExportingMetricReader({
			exporter: exporters.metricExporter,
			exportIntervalMillis: EXPORT_INTERVAL_MILLIS,
		});
	}

        // Drop spans by name (e.g., graphql.parseSchema / graphql.validate) while keeping the rest
    public buildSampler(): Sampler {
        // Compile a small denylist of noisy GraphQL spans
        const denylist = [/^graphql\.parseSchema$/, /^graphql\.parse$/, /^graphql\.validate$/];

        class NameFilterSampler implements Sampler {
            private readonly delegate: Sampler;
            constructor(delegate: Sampler) {
                this.delegate = delegate;
            }

            shouldSample(context: Context, traceId: string, spanName: string, spanKind: SpanKind, attributes: Attributes, links: Link[]) {
                // If the span name matches any entry in the denylist, drop the span
                if (denylist.some((re) => re.test(spanName))) {
                    return { decision: SamplingDecision.NOT_RECORD };
                }
                return this.delegate.shouldSample(context, traceId, spanName, spanKind, attributes, links);
            }

            toString() { return 'NameFilterSampler(deny: graphql.parse*, graphql.validate)'; }
        }

        return new ParentBasedSampler({
            root: new NameFilterSampler(new AlwaysOnSampler()),
        });
    }

	public buildInstrumentations() {
		return [
			new HttpInstrumentation(httpInstrumentationConfig), //required by AzureFunctionsInstrumentation
			new AzureFunctionsInstrumentation({ enabled: true }),
			new GraphQLInstrumentation({ 
                allowValues: true,
                ignoreTrivialResolveSpans: true,

            }),
			new DataloaderInstrumentation(),
			new MongooseInstrumentation(),
		];
	}
}
