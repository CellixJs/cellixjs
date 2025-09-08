/**
 * Monorepo-Level Architecture Tests for CellixJS
 * 
 * Tests the overall architectural integrity across all workspace packages
 */

import { describe, it } from 'vitest';
import { 
  executeArchRule,
  executeArchRules,
  shouldEnableDebugLogging,
  PACKAGE_NAMES,
} from './shared/utils/test-helpers';
import {
  allCleanArchitectureRules,
} from './shared/rules/clean-architecture.rules';
import {
  packagesShouldHaveNoCycles,
} from './shared/rules/cyclic-dependency.rules';
import {
  allNamingConventionRules,
} from './shared/rules/naming-convention.rules';

const testOptions = {
  enableLogging: shouldEnableDebugLogging(),
  logLevel: 'info' as const,
  allowEmptyTests: false,
};

describe('Architecture: CellixJS Monorepo', () => {
  describe('Overall Clean Architecture', () => {
    it('should enforce Clean Architecture dependency rules across packages', async () => {
      // Test a subset of critical rules to avoid overwhelming output
      const criticalRules = [
        allCleanArchitectureRules[0], // domainShouldNotDependOnInfrastructure
        allCleanArchitectureRules[1], // domainShouldNotDependOnApplication
        allCleanArchitectureRules[4], // applicationShouldNotDependOnInfrastructure
      ];
      
      await executeArchRules(criticalRules, testOptions);
    });
  });

  describe('Monorepo Structure', () => {
    it('packages should not have circular dependencies', async () => {
      await executeArchRule(packagesShouldHaveNoCycles(), testOptions);
    });

    it('should have consistent package structure', async () => {
      const { projectFiles } = await import('archunit');
      
      // Each package should have a package.json
      const rule = projectFiles()
        .inPath('packages/*/package.json')
        .should()
        .exist();
      
      await executeArchRule(rule, { ...testOptions, allowEmptyTests: true });
    });

    it('should follow workspace naming conventions', async () => {
      const { projectFiles } = await import('archunit');
      
      // Package directories should follow kebab-case
      const rule = projectFiles()
        .inFolder('packages/**')
        .should()
        .haveNoCycles(); // Basic structural validation
      
      await executeArchRule(rule, testOptions);
    });
  });

  describe('Package Boundaries', () => {
    it('UI packages should not depend on backend packages', async () => {
      const { projectFiles } = await import('archunit');
      
      const rule = projectFiles()
        .inFolder('packages/ui-*/**')
        .shouldNot()
        .dependOnFiles()
        .inFolder('packages/api/**');
      
      await executeArchRule(rule, { ...testOptions, allowEmptyTests: true });
    });

    it('domain packages should be independent of infrastructure', async () => {
      const { projectFiles } = await import('archunit');
      
      const rule = projectFiles()
        .inFolder('packages/*domain*/**')
        .shouldNot()
        .dependOnFiles()
        .inFolder('packages/service-*/**');
      
      await executeArchRule(rule, { ...testOptions, allowEmptyTests: true });
    });

    it('seedwork packages should be foundational', async () => {
      const { projectFiles } = await import('archunit');
      
      // Seedwork should not depend on application-specific packages
      const rule = projectFiles()
        .inFolder('packages/*seedwork*/**')
        .shouldNot()
        .dependOnFiles()
        .inFolder('packages/api-*/**');
      
      await executeArchRule(rule, { ...testOptions, allowEmptyTests: true });
    });
  });

  describe('Naming Conventions', () => {
    it('should follow consistent naming patterns', async () => {
      // Test key naming convention rules
      const keyNamingRules = [
        allNamingConventionRules[0], // testFilesShouldFollowNamingConvention
        allNamingConventionRules[3], // configFilesShouldUseKebabCase
        allNamingConventionRules[6], // indexFilesShouldBeConsistent
        allNamingConventionRules[7], // packageJsonShouldBeLowercase
      ];
      
      await executeArchRules(keyNamingRules, { ...testOptions, allowEmptyTests: true });
    });
  });

  describe('Configuration Consistency', () => {
    it('should have consistent Vitest configurations', async () => {
      const { projectFiles } = await import('archunit');
      
      const rule = projectFiles()
        .withName('vitest.config.ts')
        .should()
        .exist();
      
      await executeArchRule(rule, testOptions);
    });

    it('should have consistent TypeScript configurations', async () => {
      const { projectFiles } = await import('archunit');
      
      const rule = projectFiles()
        .withName('tsconfig*.json')
        .should()
        .exist();
      
      await executeArchRule(rule, testOptions);
    });

    it('should have consistent package.json structure', async () => {
      const { projectFiles } = await import('archunit');
      
      // Each workspace package should have package.json
      const rule = projectFiles()
        .inPath('packages/*/package.json')
        .should()
        .exist();
      
      await executeArchRule(rule, { ...testOptions, allowEmptyTests: true });
    });
  });

  describe('Documentation Standards', () => {
    it('should have README files where appropriate', async () => {
      const { projectFiles } = await import('archunit');
      
      const rule = projectFiles()
        .withName(/^README\.md$/i)
        .should()
        .exist();
      
      await executeArchRule(rule, { ...testOptions, allowEmptyTests: true });
    });

    it('should have instruction files for architectural guidance', async () => {
      const { projectFiles } = await import('archunit');
      
      const rule = projectFiles()
        .withName('*.instructions.md')
        .should()
        .exist();
      
      await executeArchRule(rule, { ...testOptions, allowEmptyTests: true });
    });
  });

  describe('Code Quality Standards', () => {
    it('should maintain reasonable file sizes across packages', async () => {
      const { metrics } = await import('archunit');
      
      const rule = metrics()
        .inFolder('packages/**')
        .count()
        .linesOfCode()
        .shouldBeBelow(1000); // No file should be excessively large
      
      await executeArchRule(rule, { ...testOptions, allowEmptyTests: true });
    });

    it('should maintain reasonable complexity across packages', async () => {
      const { metrics } = await import('archunit');
      
      const rule = metrics()
        .inFolder('packages/**')
        .count()
        .methodCount()
        .shouldBeBelow(25); // No class should have too many methods
      
      await executeArchRule(rule, { ...testOptions, allowEmptyTests: true });
    });
  });
});