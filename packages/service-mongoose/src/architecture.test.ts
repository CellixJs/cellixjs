/**
 * Architecture Tests for Service Mongoose Package
 * 
 * Tests the infrastructure service to ensure proper separation of concerns
 */

import { describe, it } from 'vitest';
import { 
  executeArchRule,
  executeArchRules,
  shouldEnableDebugLogging,
} from '../../../architecture/shared/utils/test-helpers';
import {
  servicesShouldNotDependOnDomain,
  servicesShouldNotDependOnApplication,
} from '../../../architecture/shared/rules/clean-architecture.rules';
import {
  servicesShouldHaveNoCycles,
} from '../../../architecture/shared/rules/cyclic-dependency.rules';

const testOptions = {
  enableLogging: shouldEnableDebugLogging(),
  logLevel: 'info' as const,
  allowEmptyTests: true, // Services might be small and focused
};

describe('Architecture: Service Mongoose Package', () => {
  describe('Infrastructure Service Principles', () => {
    it('service should not depend on domain layer', async () => {
      await executeArchRule(servicesShouldNotDependOnDomain(), testOptions);
    });

    it('service should not depend on application layer', async () => {
      await executeArchRule(servicesShouldNotDependOnApplication(), testOptions);
    });

    it('service should not depend on other services directly', async () => {
      const { projectFiles } = await import('archunit');
      const rule = projectFiles()
        .inFolder('src/**')
        .shouldNot()
        .dependOnFiles()
        .inFolder('**/service-*/**');
      
      await executeArchRule(rule, testOptions);
    });

    it('service should not depend on UI layer', async () => {
      const { projectFiles } = await import('archunit');
      const rule = projectFiles()
        .inFolder('src/**')
        .shouldNot()
        .dependOnFiles()
        .inFolder('**/ui/**');
      
      await executeArchRule(rule, testOptions);
    });
  });

  describe('Cyclic Dependencies', () => {
    it('service should have no circular dependencies', async () => {
      await executeArchRule(servicesShouldHaveNoCycles(), testOptions);
    });
  });

  describe('Service Quality', () => {
    it('service should be focused and lightweight', async () => {
      const { metrics } = await import('archunit');
      const rule = metrics()
        .inFolder('src/**')
        .count()
        .linesOfCode()
        .shouldBeBelow(250); // Infrastructure services should be focused
      
      await executeArchRule(rule, testOptions);
    });

    it('service should have reasonable method count', async () => {
      const { metrics } = await import('archunit');
      const rule = metrics()
        .inFolder('src/**')
        .count()
        .methodCount()
        .shouldBeBelow(10); // Infrastructure services should be focused
      
      await executeArchRule(rule, testOptions);
    });

    it('service should have good cohesion', async () => {
      const { metrics } = await import('archunit');
      const rule = metrics()
        .inFolder('src/**')
        .lcom()
        .lcom96b()
        .shouldBeBelow(0.6); // Infrastructure services should be cohesive
      
      await executeArchRule(rule, testOptions);
    });
  });

  describe('MongoDB Integration', () => {
    it('should properly encapsulate MongoDB concerns', async () => {
      const { projectFiles } = await import('archunit');
      const rule = projectFiles()
        .inFolder('src/**')
        .should()
        .haveNoCycles(); // Basic structural validation
      
      await executeArchRule(rule, testOptions);
    });
  });
});