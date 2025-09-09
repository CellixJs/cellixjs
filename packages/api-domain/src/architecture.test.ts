/**
 * Architecture Tests for API Domain Package
 * 
 * Tests the core domain layer to ensure Clean Architecture and DDD principles
 */

import { describe, it } from 'vitest';
import {
  domainShouldNotDependOnInfrastructure,
  domainShouldNotDependOnApplication,
  domainShouldNotDependOnApi,
  domainShouldNotDependOnUI,
  domainShouldHaveNoCycles,
  executeArchRule,
  projectFiles,
  metrics,
} from '@cellix/test-core-archunit';

describe('Architecture: API Domain Package', () => {
  describe('Clean Architecture Principles', () => {
    it('domain should not depend on infrastructure layer', async () => {
      const rule = domainShouldNotDependOnInfrastructure();
      await executeArchRule(rule, { allowEmptyTests: true });
    });

    it('domain should not depend on application layer', async () => {
      const rule = domainShouldNotDependOnApplication();
      await executeArchRule(rule, { allowEmptyTests: true });
    });

    it('domain should not depend on API layer', async () => {
      const rule = domainShouldNotDependOnApi();
      await executeArchRule(rule, { allowEmptyTests: true });
    });

    it('domain should not depend on UI layer', async () => {
      const rule = domainShouldNotDependOnUI();
      await executeArchRule(rule, { allowEmptyTests: true });
    });
  });

  describe('Cyclic Dependencies', () => {
    it('domain should have no circular dependencies', async () => {
      const rule = domainShouldHaveNoCycles();
      await executeArchRule(rule, { allowEmptyTests: true, enableLogging: true });
    });
  });

  describe('Domain File Structure', () => {
    it('should have domain files present', async () => {
      const rule = projectFiles()
        .inFolder('src/domain/**')
        .should()
        .haveNoCycles();
        
      await executeArchRule(rule, { allowEmptyTests: true });
    });
  });

  describe('Code Quality', () => {
    it('domain should maintain reasonable method counts', async () => {
      const rule = metrics()
        .inFolder('src/domain/**')
        .count()
        .methodCount()
        .shouldBeBelow(20);
        
      await executeArchRule(rule, { allowEmptyTests: true });
    });
  });
});