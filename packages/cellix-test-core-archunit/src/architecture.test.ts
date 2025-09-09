/**
 * Architecture Tests for the ArchUnit Test Core Package
 */

import { describe, it } from 'vitest';
import {
  domainShouldNotDependOnInfrastructure,
  domainShouldNotDependOnApplication,
  executeArchRule,
} from './index.js';

describe('Architecture: Test Core ArchUnit Package', () => {
  describe('Core Rules Validation', () => {
    it('should provide working clean architecture rules', async () => {
      const rule = domainShouldNotDependOnInfrastructure();
      await executeArchRule(rule, { allowEmptyTests: true });
    });

    it('should provide working domain layer rules', async () => {
      const rule = domainShouldNotDependOnApplication();
      await executeArchRule(rule, { allowEmptyTests: true });
    });
  });
});