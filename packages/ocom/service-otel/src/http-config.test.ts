import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { expect, vi } from 'vitest';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { httpInstrumentationConfig } from './http-config.ts';
import type { IncomingMessage } from 'node:http';


const test = { for: describeFeature };
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feature = await loadFeature(
  path.resolve(__dirname, 'features/http-config.feature')
);

test.for(feature, ({ Scenario }) => {
  Scenario('Ignoring incoming OPTIONS requests', ({ Given, When, Then }) => {
    let request: IncomingMessage;
    let result: boolean;

    Given('an incoming HTTP request with method OPTIONS', () => {
      request = vi.mocked({ method: 'OPTIONS' } as IncomingMessage);
    });

    When('ignoreIncomingRequestHook is called', () => {
      result = httpInstrumentationConfig.ignoreIncomingRequestHook?.(request) ?? false;
    });

    Then('it should return true', () => {
      expect(result).toBe(true);
    });
  });

  Scenario('Not ignoring incoming GET requests', ({ Given, When, Then }) => {
    let request: IncomingMessage;
    let result: boolean;

    Given('an incoming HTTP request with method GET', () => {
      request = vi.mocked({ method: 'GET' } as IncomingMessage);
    });

    When('ignoreIncomingRequestHook is called', () => {
      result = httpInstrumentationConfig.ignoreIncomingRequestHook?.(request) ?? true;
    });

    Then('it should return false', () => {
      expect(result).toBe(false);
    });
  });

  Scenario('Ignoring outgoing requests to /api/graphql', ({ Given, When, Then }) => {
    let options: { path: string };
    let result: boolean;

    Given('an outgoing HTTP request with path starting with /api/graphql', () => {
      options = { path: '/api/graphql/query' };
    });

    When('ignoreOutgoingRequestHook is called', () => {
      result = httpInstrumentationConfig.ignoreOutgoingRequestHook?.(options) ?? false;
    });

    Then('it should return true', () => {
      expect(result).toBe(true);
    });
  });

  Scenario('Not ignoring outgoing requests to other paths', ({ Given, When, Then }) => {
    let options: { path: string };
    let result: boolean;

    Given('an outgoing HTTP request with path /api/other', () => {
      options = { path: '/api/other' };
    });

    When('ignoreOutgoingRequestHook is called', () => {
      result = httpInstrumentationConfig.ignoreOutgoingRequestHook?.(options) ?? true;
    });

    Then('it should return false', () => {
      expect(result).toBe(false);
    });
  });

  Scenario('Not ignoring outgoing requests with undefined path', ({ Given, When, Then }) => {
    let options: object;
    let result: boolean;

    Given('an outgoing HTTP request with no path property', () => {
      options = {};
    });

    When('ignoreOutgoingRequestHook is called', () => {
      result = httpInstrumentationConfig.ignoreOutgoingRequestHook?.(options) ?? true;
    });

    Then('it should return false', () => {
      expect(result).toBe(false);
    });
  });
});
