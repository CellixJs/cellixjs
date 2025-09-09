/**
 * Architecture Tests for Main API Package
 * 
 * Tests the main API entry point to ensure proper layering and Azure Functions integration
 */

import { describe, it } from 'vitest';
import { 
  executeArchRule,
  executeArchRules,
  apiShouldHaveNoCycles,
  projectFiles,
  metrics,
} from '@cellix/test-core-archunit';

const testOptions = {
  enableLogging: false,
  allowEmptyTests: true,
};

describe('Architecture: Main API Package', () => {
  describe('API Layer Structure', () => {
    it('API should not create circular dependencies', async () => {
      await executeArchRule(apiShouldHaveNoCycles(), testOptions);
    });

    it('API handlers should be lightweight orchestration', async () => {
      const rule = metrics()
        .inFolder('src/**')
        .count()
        .linesOfCode()
        .shouldBeBelow(100);
      
      await executeArchRule(rule, testOptions);
    });

    it('API should not directly depend on infrastructure implementations', async () => {
      const rules = [
        () => projectFiles()
          .inFolder('src/**')
          .shouldNot()
          .dependOnFiles()
          .inFolder('**/infrastructure/**'),
      ];
      
      await executeArchRules(rules, testOptions);
    });
  });

  describe('Azure Functions Integration', () => {
    it('should properly structure Azure Functions handlers', async () => {
      const rule = projectFiles()
        .inFolder('src/**')
        .should()
        .haveNoCycles();
      
      await executeArchRule(rule, testOptions);
    });

    it('handlers should have reasonable complexity', async () => {
      const rule = metrics()
        .inFolder('src/**')
        .count()
        .methodCount()
        .shouldBeBelow(8);
      
      await executeArchRule(rule, testOptions);
    });
  });
});