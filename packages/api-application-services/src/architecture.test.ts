/**
 * Architecture Tests for API Application Services Package
 * 
 * Tests the application layer to ensure proper orchestration and Clean Architecture
 */

import { describe, it } from 'vitest';
import { 
  executeArchRule,
  executeArchRules,
  shouldEnableDebugLogging,
} from '../../../architecture/shared/utils/test-helpers';
import {
  applicationShouldNotDependOnInfrastructure,
  applicationShouldNotDependOnUI,
  applicationShouldNotDependOnApi,
} from '../../../architecture/shared/rules/clean-architecture.rules';
import {
  applicationShouldHaveNoCycles,
} from '../../../architecture/shared/rules/cyclic-dependency.rules';

const testOptions = {
  enableLogging: shouldEnableDebugLogging(),
  logLevel: 'info' as const,
  allowEmptyTests: false,
};

describe('Architecture: API Application Services Package', () => {
  describe('Clean Architecture Principles', () => {
    it('application layer should not depend on infrastructure', async () => {
      await executeArchRule(applicationShouldNotDependOnInfrastructure(), testOptions);
    });

    it('application layer should not depend on UI layer', async () => {
      await executeArchRule(applicationShouldNotDependOnUI(), testOptions);
    });

    it('application layer should not depend on API layer', async () => {
      await executeArchRule(applicationShouldNotDependOnApi(), testOptions);
    });
  });

  describe('Cyclic Dependencies', () => {
    it('application services should have no circular dependencies', async () => {
      await executeArchRule(applicationShouldHaveNoCycles(), testOptions);
    });
  });

  describe('Application Service Quality', () => {
    it('application services should be focused and cohesive', async () => {
      // Application services should have high cohesion since they orchestrate use cases
      const { metrics } = await import('archunit');
      const rule = metrics()
        .inFolder('src/**')
        .lcom()
        .lcom96b()
        .shouldBeBelow(0.4); // Higher cohesion threshold for application services
      
      await executeArchRule(rule, testOptions);
    });

    it('application services should not be too large', async () => {
      // Application services should be focused on specific use cases
      const { metrics } = await import('archunit');
      const rule = metrics()
        .inFolder('src/**')
        .count()
        .linesOfCode()
        .shouldBeBelow(200);
      
      await executeArchRule(rule, testOptions);
    });

    it('application services should have reasonable method count', async () => {
      // Application services should not have too many methods
      const { metrics } = await import('archunit');
      const rule = metrics()
        .inFolder('src/**')
        .count()
        .methodCount()
        .shouldBeBelow(10);
      
      await executeArchRule(rule, testOptions);
    });
  });
});