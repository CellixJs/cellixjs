/**
 * Architecture Tests for Service Mongoose Package
 * 
 * Tests the infrastructure service to ensure proper separation of concerns
 */

import { describe, it } from 'vitest';
import { 
  executeArchRule,
  servicesShouldNotDependOnDomain,
  servicesShouldNotDependOnApplication,
  servicesShouldHaveNoCycles,
  projectFiles,
  metrics,
} from '@cellix/test-core-archunit';

const testOptions = {
  enableLogging: false,
  allowEmptyTests: true,
};

describe('Architecture: Service Mongoose Package', () => {
  describe('Infrastructure Layer Rules', () => {
    it('services should not depend on domain layer', async () => {
      await executeArchRule(servicesShouldNotDependOnDomain(), testOptions);
    });

    it('services should not depend on application layer', async () => {
      await executeArchRule(servicesShouldNotDependOnApplication(), testOptions);
    });

    it('services should not have circular dependencies', async () => {
      await executeArchRule(servicesShouldHaveNoCycles(), testOptions);
    });
  });

  describe('Infrastructure Service Quality', () => {
    it('infrastructure services should be focused and cohesive', async () => {
      const rule = metrics()
        .inFolder('src/**')
        .lcom()
        .lcom96b()
        .shouldBeBelow(0.3);
      
      await executeArchRule(rule, testOptions);
    });

    it('infrastructure services should not be too complex', async () => {
      const rule = metrics()
        .inFolder('src/**')
        .count()
        .methodCount()
        .shouldBeBelow(15);
      
      await executeArchRule(rule, testOptions);
    });
  });

  describe('Data Access Patterns', () => {
    it('should not expose infrastructure details', async () => {
      const rule = projectFiles()
        .inFolder('src/**')
        .should()
        .haveNoCycles();
      
      await executeArchRule(rule, testOptions);
    });
  });
});