/**
 * Architecture Tests for Cellix Domain Seedwork Package
 * 
 * Tests the domain seedwork to ensure it provides clean foundational abstractions
 */

import { describe, it } from 'vitest';
import { 
  executeArchRule,
  executeArchRules,
  shouldEnableDebugLogging,
} from '../../../architecture/shared/utils/test-helpers';
import {
  seedworkShouldHaveNoCycles,
} from '../../../architecture/shared/rules/cyclic-dependency.rules';

const testOptions = {
  enableLogging: shouldEnableDebugLogging(),
  logLevel: 'info' as const,
  allowEmptyTests: false,
};

describe('Architecture: Cellix Domain Seedwork Package', () => {
  describe('Seedwork Independence', () => {
    it('seedwork should not depend on application concerns', async () => {
      const { projectFiles } = await import('archunit');
      const rule = projectFiles()
        .inFolder('src/**')
        .shouldNot()
        .dependOnFiles()
        .inFolder('**/application/**');
      
      await executeArchRule(rule, testOptions);
    });

    it('seedwork should not depend on infrastructure concerns', async () => {
      const { projectFiles } = await import('archunit');
      const rule = projectFiles()
        .inFolder('src/**')
        .shouldNot()
        .dependOnFiles()
        .inFolder('**/infrastructure/**');
      
      await executeArchRule(rule, testOptions);
    });

    it('seedwork should not depend on UI concerns', async () => {
      const { projectFiles } = await import('archunit');
      const rule = projectFiles()
        .inFolder('src/**')
        .shouldNot()
        .dependOnFiles()
        .inFolder('**/ui/**');
      
      await executeArchRule(rule, testOptions);
    });

    it('seedwork should not depend on external frameworks', async () => {
      const { projectFiles } = await import('archunit');
      const rules = [
        () => projectFiles()
          .inFolder('src/**')
          .shouldNot()
          .dependOnFiles()
          .inPath('**/node_modules/express/**'),
        () => projectFiles()
          .inFolder('src/**')
          .shouldNot()
          .dependOnFiles()
          .inPath('**/node_modules/@azure/functions/**'),
        () => projectFiles()
          .inFolder('src/**')
          .shouldNot()
          .dependOnFiles()
          .inPath('**/node_modules/mongoose/**'),
      ];
      
      await executeArchRules(rules, testOptions);
    });
  });

  describe('Cyclic Dependencies', () => {
    it('seedwork should have no circular dependencies', async () => {
      await executeArchRule(seedworkShouldHaveNoCycles(), testOptions);
    });
  });

  describe('Seedwork Quality', () => {
    it('seedwork abstractions should be lightweight and focused', async () => {
      const { metrics } = await import('archunit');
      const rule = metrics()
        .inFolder('src/**')
        .count()
        .linesOfCode()
        .shouldBeBelow(150); // Seedwork should provide focused abstractions
      
      await executeArchRule(rule, testOptions);
    });

    it('seedwork should have high cohesion', async () => {
      const { metrics } = await import('archunit');
      const rule = metrics()
        .inFolder('src/**')
        .lcom()
        .lcom96b()
        .shouldBeBelow(0.3); // Very high cohesion for foundational abstractions
      
      await executeArchRule(rule, testOptions);
    });

    it('seedwork should not have too many methods per class', async () => {
      const { metrics } = await import('archunit');
      const rule = metrics()
        .inFolder('src/**')
        .count()
        .methodCount()
        .shouldBeBelow(12); // Focused interfaces
      
      await executeArchRule(rule, testOptions);
    });
  });
});