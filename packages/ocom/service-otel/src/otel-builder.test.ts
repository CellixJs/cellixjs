import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { ConsoleSpanExporter } from '@opentelemetry/sdk-trace-node';
import { ConsoleMetricExporter } from '@opentelemetry/sdk-metrics';
import { ConsoleLogRecordExporter } from '@opentelemetry/sdk-logs';
import { SimpleSpanProcessor, BatchSpanProcessor } from '@opentelemetry/sdk-trace-node';
import { SimpleLogRecordProcessor, BatchLogRecordProcessor } from '@opentelemetry/sdk-logs';
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import { DataloaderInstrumentation } from '@opentelemetry/instrumentation-dataloader';
import { GraphQLInstrumentation } from '@opentelemetry/instrumentation-graphql';
import azureOtel from '@azure/functions-opentelemetry-instrumentation';
import { MongooseInstrumentation } from '@opentelemetry/instrumentation-mongoose';
import { expect, vi } from 'vitest';
import { OtelBuilder } from './otel-builder.ts';

// Move mocks INSIDE the vi.mock factory to avoid hoisting issues
vi.mock('@azure/monitor-opentelemetry-exporter', () => {
  // Unique classes for instanceof checks
  class TraceExporter {}
  class MetricExporter {}
  class LogExporter {}
  // Mocks that attach args for assertion
  const traceExporterMock = vi.fn((args) => Object.assign(new TraceExporter(), { __args: args }));
  const metricExporterMock = vi.fn((args) => Object.assign(new MetricExporter(), { __args: args }));
  const logExporterMock = vi.fn((args) => Object.assign(new LogExporter(), { __args: args }));
  // Expose mocks and classes for test access
  return {
    AzureMonitorTraceExporter: traceExporterMock,
    AzureMonitorMetricExporter: metricExporterMock,
    AzureMonitorLogExporter: logExporterMock,
    // For test access
    __test: {
      traceExporterMock,
      metricExporterMock,
      logExporterMock,
      TraceExporter,
      MetricExporter,
      LogExporter,
    },
  };
});

const { AzureFunctionsInstrumentation } = azureOtel;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feature = await loadFeature(
  path.resolve(__dirname, 'features/otel-builder.feature')
);

describeFeature(feature, ({ Scenario, BeforeEachScenario, AfterEachScenario }) => {
  let builder: OtelBuilder;
  let originalEnv: NodeJS.ProcessEnv;
  let traceExporterMock: ReturnType<typeof vi.fn>;
  let metricExporterMock: ReturnType<typeof vi.fn>;
  let logExporterMock: ReturnType<typeof vi.fn>;
  let TraceExporter: new (...args: unknown[]) => unknown;
  let MetricExporter: new (...args: unknown[]) => unknown;
  let LogExporter: new (...args: unknown[]) => unknown;

  BeforeEachScenario(async () => {
    builder = new OtelBuilder();
    originalEnv = { ...process.env };
    // Get the actual mocks and classes from the module
    // biome-ignore lint:noExplicitAny
    const azureModule = await import('@azure/monitor-opentelemetry-exporter') as any;
    traceExporterMock = azureModule.__test.traceExporterMock;
    metricExporterMock = azureModule.__test.metricExporterMock;
    logExporterMock = azureModule.__test.logExporterMock;
    TraceExporter = azureModule.__test.TraceExporter;
    MetricExporter = azureModule.__test.MetricExporter;
    LogExporter = azureModule.__test.LogExporter;
    traceExporterMock.mockClear();
    metricExporterMock.mockClear();
    logExporterMock.mockClear();
  });

  AfterEachScenario(() => {
    process.env = { ...originalEnv };
    vi.restoreAllMocks();
  });

  Scenario('Building exporters for console output', ({ Given, When, Then }) => {
    let exporters: ReturnType<OtelBuilder['buildExporters']>;
    Given('an environment where exportToConsole is true', () => {
        /* done in When step */
    });
    When('buildExporters is called with exportToConsole true', () => {
      exporters = builder.buildExporters(true);
    });
    Then('it should return ConsoleSpanExporter, ConsoleMetricExporter, and ConsoleLogRecordExporter', () => {
      expect(exporters.traceExporter).toBeInstanceOf(ConsoleSpanExporter);
      expect(exporters.metricExporter).toBeInstanceOf(ConsoleMetricExporter);
      expect(exporters.logExporter).toBeInstanceOf(ConsoleLogRecordExporter);
    });
  });

  Scenario('Building exporters for Azure Monitor', ({ Given, When, Then }) => {
    let exporters: ReturnType<OtelBuilder['buildExporters']>;
    const connStr = 'InstrumentationKey=00000000-0000-0000-0000-000000000000;IngestionEndpoint=https://westus2-0.in.applicationinsights.azure.com/';
    Given('the APPLICATIONINSIGHTS_CONNECTION_STRING environment variable is set', () => {
      // biome-ignore lint:useLiteralKeys
      process.env['APPLICATIONINSIGHTS_CONNECTION_STRING'] = connStr;
    });
    When('buildExporters is called with exportToConsole false', () => {
      exporters = builder.buildExporters(false);
    });
    Then('it should return AzureMonitorTraceExporter, AzureMonitorMetricExporter, and AzureMonitorLogExporter with the correct connection string', () => {
      expect(exporters.traceExporter).toBeInstanceOf(TraceExporter);
      expect(exporters.metricExporter).toBeInstanceOf(MetricExporter);
      expect(exporters.logExporter).toBeInstanceOf(LogExporter);
      expect(traceExporterMock).toHaveBeenCalledWith({ connectionString: connStr });
      expect(metricExporterMock).toHaveBeenCalledWith({ connectionString: connStr });
      expect(logExporterMock).toHaveBeenCalledWith({ connectionString: connStr });
      // Also check the instance has the correct property for extra safety
      expect((exporters.traceExporter as unknown as { __args: { connectionString: string } }).__args.connectionString).toBe(connStr);
      expect((exporters.metricExporter as unknown as { __args: { connectionString: string } }).__args.connectionString).toBe(connStr);
      expect((exporters.logExporter as unknown as { __args: { connectionString: string } }).__args.connectionString).toBe(connStr);
    });
  });

  Scenario('Failing to build exporters without connection string', ({ Given, When, Then }) => {
    Given('the APPLICATIONINSIGHTS_CONNECTION_STRING environment variable is not set', () => {
      // biome-ignore lint:useLiteralKeys
      delete process.env['APPLICATIONINSIGHTS_CONNECTION_STRING'];
    });
    When('buildExporters is called with exportToConsole false', () => {
        /* Done in Then step */
    });
    Then('it should throw an error about the missing environment variable', () => {
      expect(() => builder.buildExporters(false)).toThrow(
        'Missing required environment variable: APPLICATIONINSIGHTS_CONNECTION_STRING'
      );
    });
  });

  Scenario('Building simple processors', ({ Given, When, Then }) => {
    let processors: ReturnType<OtelBuilder['buildProcessors']>;
    let exporters: ReturnType<OtelBuilder['buildExporters']>;
    Given('exporters are provided', () => {
      exporters = builder.buildExporters(true);
    });
    When('buildProcessors is called with useSimpleProcessors true', () => {
      processors = builder.buildProcessors(true, exporters);
    });
    Then('it should return SimpleSpanProcessor and SimpleLogRecordProcessor using the provided exporters', () => {
      expect(processors.spanProcessors?.[0]).toBeInstanceOf(SimpleSpanProcessor);
      expect(processors.logRecordProcessors?.[0]).toBeInstanceOf(SimpleLogRecordProcessor);
      // @ts-expect-error: test private
      expect(processors.spanProcessors?.[0]._exporter).toBe(exporters.traceExporter);
      // @ts-expect-error: test private
      expect(processors.logRecordProcessors?.[0]._exporter).toBe(exporters.logExporter);
    });
  });

  Scenario('Building batch processors', ({ Given, When, Then }) => {
    let processors: ReturnType<OtelBuilder['buildProcessors']>;
    let exporters: ReturnType<OtelBuilder['buildExporters']>;
    Given('exporters are provided', () => {
      exporters = builder.buildExporters(true);
    });
    When('buildProcessors is called with useSimpleProcessors false', () => {
      processors = builder.buildProcessors(false, exporters);
    });
    Then('it should return BatchSpanProcessor and BatchLogRecordProcessor using the provided exporters and correct options', () => {
      expect(processors.spanProcessors?.[0]).toBeInstanceOf(BatchSpanProcessor);
      expect(processors.logRecordProcessors?.[0]).toBeInstanceOf(BatchLogRecordProcessor);
      // @ts-expect-error: test private
      expect(processors.spanProcessors?.[0]._exporter).toBe(exporters.traceExporter);
      // @ts-expect-error: test private
      expect(processors.logRecordProcessors?.[0]._exporter).toBe(exporters.logExporter);
      // @ts-expect-error: test private
      expect(processors.spanProcessors?.[0]._maxQueueSize).toBe(1000);
      // @ts-expect-error: test private
      expect(processors.spanProcessors?.[0]._exportTimeoutMillis).toBe(15000);
      // @ts-expect-error: test private
      expect(processors.logRecordProcessors?.[0]._maxQueueSize).toBe(1000);
      // @ts-expect-error: test private
      expect(processors.logRecordProcessors?.[0]._exportTimeoutMillis).toBe(15000);
    });
  });

  Scenario('Building a metric reader', ({ Given, When, Then }) => {
    let metricReader: PeriodicExportingMetricReader;
    let exporters: ReturnType<OtelBuilder['buildExporters']>;
    Given('exporters are provided', () => {
      exporters = builder.buildExporters(true);
    });
    When('buildMetricReader is called', () => {
      metricReader = builder.buildMetricReader(exporters);
    });
    Then('it should return a PeriodicExportingMetricReader with the correct exporter and interval', () => {
      expect(metricReader).toBeInstanceOf(PeriodicExportingMetricReader);
      // @ts-expect-error: test private
      expect(metricReader._exporter).toBe(exporters.metricExporter);
      // @ts-expect-error: test private
      expect(metricReader._exportInterval).toBe(60000);
    });
  });

  Scenario('Building instrumentations', ({ Given, When, Then }) => {
    let instrumentations: unknown[];
    Given('exporters are provided', () => {
        /* */
    });
    When('buildInstrumentations is called', () => {
      instrumentations = builder.buildInstrumentations();
    });
    Then('it should return an array including HttpInstrumentation, AzureFunctionsInstrumentation, GraphQLInstrumentation, DataloaderInstrumentation, and MongooseInstrumentation', () => {
      expect(instrumentations.some(i => i instanceof HttpInstrumentation)).toBe(true);
      expect(instrumentations.some(i => i instanceof AzureFunctionsInstrumentation)).toBe(true);
      expect(instrumentations.some(i => i instanceof GraphQLInstrumentation)).toBe(true);
      expect(instrumentations.some(i => i instanceof DataloaderInstrumentation)).toBe(true);
      expect(instrumentations.some(i => i instanceof MongooseInstrumentation)).toBe(true);
    });
  });
});
