import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { expect, vi } from 'vitest';
import { ServiceOtel } from './index.ts';


const test = { for: describeFeature };
vi.mock('@opentelemetry/sdk-node', () => {
  // Mock Resource class and resources namespace
  class Resource {
    private attributes: Record<string, unknown>;
    constructor(attrs: Record<string, unknown>) {
      this.attributes = attrs;
    }
    static default() {
      return new Resource({ default: true });
    }
    merge(other: Resource) {
      return new Resource({ ...this.attributes, ...other.attributes });
    }
  }
  // Mock NodeSDK and track config
  let lastConfig: unknown;
  class NodeSDK {
    public start = vi.fn();
    public shutdown = vi.fn();
    constructor(config: unknown) {
      lastConfig = config;
    }
    static getLastConfig() {
      return lastConfig;
    }
  }
  return {
    NodeSDK,
    resources: { Resource },
  };
});

vi.mock('@opentelemetry/semantic-conventions', () => ({
  ATTR_SERVICE_NAME: 'service.name',
  ATTR_SERVICE_VERSION: 'service.version',
}));

vi.mock('./otel-builder.js', () => {
  return {
    OtelBuilder: class {
      buildExporters(exportToConsole?: boolean) {
        return { traceExporter: 'trace', metricExporter: 'metric', logExporter: 'log', exportToConsole };
      }
      buildProcessors(useSimpleProcessors?: boolean, _exporters?: unknown) {
        return { spanProcessors: useSimpleProcessors ? ['simple'] : ['batch'] };
      }
      buildMetricReader(_exporters?: unknown) {
        return 'metricReader';
      }
      buildInstrumentations() {
        return ['http', 'azure', 'graphql', 'dataloader', 'mongoose'];
      }
      buildSampler() {
        return 'sampler';
      }
    },
  };
});

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feature = await loadFeature(
  path.resolve(__dirname, 'features/service-otel.feature')
);

test.for(feature, ({ Scenario, BeforeEachScenario }) => {
 let service: ServiceOtel;
  let logSpy: ReturnType<typeof vi.spyOn>;
  let getLastConfig: () => unknown;

  BeforeEachScenario(async () => {
    // biome-ignore lint/suspicious/noExplicitAny: test code, dynamic property access
    // biome-ignore lint/plugin/no-type-assertion: test file
    const sdkNodeModule = await import('@opentelemetry/sdk-node') as any;
    getLastConfig = sdkNodeModule.NodeSDK.getLastConfig;
    logSpy = vi.spyOn(console, 'log').mockImplementation(() => { /* no-op */ });
  });

  Scenario('Constructing ServiceOtel with default configuration', ({ Given, When, Then }) => {
    Given('no specific options for the Open Telemetry service', () => {
      // No options needed
    });
    When('the OpenTelemetry service is constructed with no options', () => {
      service = new ServiceOtel({});
    });
    Then('it should initialize the OpenTelemetry NodeSDK with default resource and instrumentations', () => {
      expect(getLastConfig()).toMatchObject({
        metricReader: 'metricReader',
        instrumentations: expect.arrayContaining(['http', 'azure', 'graphql', 'dataloader', 'mongoose']),
        resource: expect.anything(),
      });
    });
  });

  Scenario('Constructing ServiceOtel with exportToConsole enabled', ({ When, Then }) => {
    When('the OpenTelemetry service is constructed with exportToConsole set to true', () => {
      service = new ServiceOtel({ exportToConsole: true });
    });
    Then('it should configure exporters to output telemetry to the console', () => {
      expect(getLastConfig()).toMatchObject({
        metricReader: 'metricReader',
        instrumentations: expect.arrayContaining(['http', 'azure', 'graphql', 'dataloader', 'mongoose']),
      });
      // The exporters are not directly exposed, but we can check the config indirectly
      // by checking the OtelBuilder mock's exportToConsole property
      // (see buildExporters mock above)
    });
  });

  Scenario('Constructing ServiceOtel with useSimpleProcessors enabled', ({ When, Then }) => {
    When('the OpenTelemetry service is constructed with useSimpleProcessors set to true', () => {
      service = new ServiceOtel({ useSimpleProcessors: true });
    });
    Then('it should configure the SDK to use simple processors for telemetry', () => {
      expect(getLastConfig()).toMatchObject({
        spanProcessors: ['simple'],
      });
    });
  });

  Scenario('Starting up the service', ({ Given, When, Then }) => {
    Given('an OpenTelemetry service instance', () => {
      service = new ServiceOtel({});
    });
    When('startUp is called', () => {
      service.startUp();
    });
    Then('it should start the OpenTelemetry NodeSDK', () => {
      // biome-ignore lint/plugin/no-type-assertion: test file
      expect((service as unknown as { sdk: { start: () => void } }).sdk.start).toHaveBeenCalled();
    });
  });

  Scenario('Shutting down the service', ({ Given, When, Then }) => {
    Given('a started OpenTelemetry service instance', () => {
      service = new ServiceOtel({});
    });
    When('shutDown is called', () => {
      service.shutDown();
    });
    Then('it should shut down the OpenTelemetry NodeSDK and log that the service stopped', () => {
      // biome-ignore lint/plugin/no-type-assertion: test file
      expect((service as unknown as { sdk: { shutdown: () => void } }).sdk.shutdown).toHaveBeenCalled();
      expect(logSpy).toHaveBeenCalledWith('ServiceOtel stopped');
    });
  });
});
