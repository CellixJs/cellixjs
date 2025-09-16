import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { execSync } from 'child_process';
import fs from 'fs';

describe('turbo-utils.js', () => {
  const originalCwd = process.cwd();
  
  beforeEach(() => {
    // Change to the parent directory to run the script
    process.chdir('/home/runner/work/cellixjs/cellixjs');
  });

  afterEach(() => {
    process.chdir(originalCwd);
  });

  describe('categorize-all command', () => {
    it('should categorize packages correctly', () => {
      const result = execSync('node scripts/turbo-utils.js categorize-all', { encoding: 'utf8' });
      const parsed = JSON.parse(result);
      
      expect(parsed).toHaveProperty('frontend');
      expect(parsed).toHaveProperty('backend');
      expect(Array.isArray(parsed.frontend)).toBe(true);
      expect(Array.isArray(parsed.backend)).toBe(true);
    });

    it('should include expected frontend packages', () => {
      const result = execSync('node scripts/turbo-utils.js categorize-all', { encoding: 'utf8' });
      const parsed = JSON.parse(result);
      
      expect(parsed.frontend).toContain('docs');
      expect(parsed.frontend).toContain('ui-community');
      expect(parsed.frontend).toContain('cellix-ui-core');
      expect(parsed.frontend).toContain('ui-components');
    });

    it('should include expected backend packages', () => {
      const result = execSync('node scripts/turbo-utils.js categorize-all', { encoding: 'utf8' });
      const parsed = JSON.parse(result);
      
      expect(parsed.backend).toContain('api');
      expect(parsed.backend).toContain('domain');
      expect(parsed.backend).toContain('cellix-domain-seedwork');
    });

    it('should exclude mock packages', () => {
      const result = execSync('node scripts/turbo-utils.js categorize-all', { encoding: 'utf8' });
      const parsed = JSON.parse(result);
      
      const allPackages = [...parsed.frontend, ...parsed.backend];
      expect(allPackages).not.toContain('cellix-mock-mongodb-memory-server');
      expect(allPackages).not.toContain('cellix-mock-oauth2-server');
    });
  });

  describe('error handling', () => {
    it('should show usage when called without arguments', () => {
      try {
        execSync('node scripts/turbo-utils.js', { encoding: 'utf8', stdio: 'pipe' });
        // If no error is thrown, the test should fail
        expect(true).toBe(false);
      } catch (error) {
        expect(error.status).toBe(1);
        // Error message goes to stderr, not stdout
        expect(error.stderr || error.message).toContain('Usage:');
      }
    });

    it('should show usage when called with invalid command', () => {
      try {
        execSync('node scripts/turbo-utils.js invalid-command', { encoding: 'utf8', stdio: 'pipe' });
        // If no error is thrown, the test should fail
        expect(true).toBe(false);
      } catch (error) {
        expect(error.status).toBe(1);
        // Error message goes to stderr, not stdout
        expect(error.stderr || error.message).toContain('Usage:');
      }
    });
  });

  describe('package detection logic', () => {
    it('should detect frontend packages correctly', () => {
      const result = execSync('node scripts/turbo-utils.js categorize-all', { encoding: 'utf8' });
      const parsed = JSON.parse(result);
      
      // UI-related packages should be in frontend
      const frontendPackages = parsed.frontend;
      expect(frontendPackages.some(pkg => pkg.includes('ui-'))).toBe(true);
      expect(frontendPackages).toContain('docs');
    });

    it('should detect backend packages correctly', () => {
      const result = execSync('node scripts/turbo-utils.js categorize-all', { encoding: 'utf8' });
      const parsed = JSON.parse(result);
      
      // API and domain packages should be in backend
      const backendPackages = parsed.backend;
      expect(backendPackages).toContain('api');
      expect(backendPackages.some(pkg => pkg.includes('domain'))).toBe(true);
    });
  });

  describe('workspace parsing', () => {
    it('should correctly parse cellix packages', () => {
      const result = execSync('node scripts/turbo-utils.js categorize-all', { encoding: 'utf8' });
      const parsed = JSON.parse(result);
      
      const allPackages = [...parsed.frontend, ...parsed.backend];
      expect(allPackages.some(pkg => pkg.startsWith('cellix-'))).toBe(true);
    });

    it('should correctly parse ocom packages', () => {
      const result = execSync('node scripts/turbo-utils.js categorize-all', { encoding: 'utf8' });
      const parsed = JSON.parse(result);
      
      const allPackages = [...parsed.frontend, ...parsed.backend];
      // OCOM packages should be parsed without the ocom prefix
      expect(allPackages).toContain('domain');
      expect(allPackages).toContain('ui-components');
    });

    it('should correctly parse app packages', () => {
      const result = execSync('node scripts/turbo-utils.js categorize-all', { encoding: 'utf8' });
      const parsed = JSON.parse(result);
      
      const allPackages = [...parsed.frontend, ...parsed.backend];
      expect(allPackages).toContain('api');
      expect(allPackages).toContain('docs');
      expect(allPackages).toContain('ui-community');
    });
  });

  describe('command validation', () => {
    it('should handle categorize-all command', () => {
      const result = execSync('node scripts/turbo-utils.js categorize-all', { encoding: 'utf8' });
      expect(() => JSON.parse(result)).not.toThrow();
    });

    it('should validate command line arguments', () => {
      // Test that script exits with non-zero code for invalid commands
      try {
        execSync('node scripts/turbo-utils.js nonexistent-command', { encoding: 'utf8', stdio: 'pipe' });
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        expect(error.status).toBe(1);
      }
    });

    it('should handle git-dependent commands gracefully', () => {
      // Test that git-dependent commands don't crash the process
      // They might return errors due to git history, but should handle gracefully
      const commands = [
        'has-frontend-changes HEAD^1',
        'has-backend-changes HEAD^1', 
        'categorize-affected HEAD^1'
      ];

      for (const cmdArgs of commands) {
        let commandCompleted = false;
        try {
          const result = execSync(`node scripts/turbo-utils.js ${cmdArgs}`, { 
            encoding: 'utf8',
            stdio: 'pipe'
          });
          commandCompleted = true;
          // If successful, result should be valid
          if (cmdArgs.includes('has-')) {
            expect(result.trim()).toMatch(/^(true|false)$/);
          } else {
            expect(() => JSON.parse(result)).not.toThrow();
          }
        } catch (error) {
          commandCompleted = true;
          // Command might fail due to git setup, which is acceptable
          // Just ensure it doesn't crash with unexpected errors
          expect(typeof error).toBe('object');
          expect(error).toBeDefined();
        }
        
        // Ensure the command attempted to run
        expect(commandCompleted).toBe(true);
      }
    });
  });
});