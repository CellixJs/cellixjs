import { describe, expect, it } from 'vitest';
import { Community, type CommunityProps } from '../../src/domain/contexts/community/community/community.ts';
import type { EndUserEntityReference } from '../../src/domain/contexts/user/end-user/end-user.ts';
import { createMockPassport, generateStringOfLength } from '../acceptance/support/community-test-utils.ts';

/**
 * Integration tests that demonstrate how the Cucumber scenarios work
 * with the domain logic. These tests implement the same scenarios
 * described in the community-management.feature file.
 */
describe('Community Management - Cucumber Integration Tests', () => {

  // Helper function to create valid community data
  const createValidCommunityData = (): CommunityProps => {
    return {
      id: '12345',
      name: '',
      domain: '',
      whiteLabelDomain: null,
      handle: null,
      // biome-ignore lint/plugin/no-type-assertion: test file
      createdBy: {} as EndUserEntityReference,
      createdAt: new Date(),
      updatedAt: new Date(),
      schemaVersion: '1.0.0',
    };
  }  

  describe('Scenario: Rejecting community creation with invalid name - too long', () => {

    it('Given I am an authorized user with community management permissions', () => {
      // Setup: Create a user with community management permissions
      const passport = createMockPassport({ canManageCommunitySettings: true });
      expect(passport).toBeDefined();
    });

    it('Given I have valid community data', () => {
      // Setup: Create valid community data structure
      const validCommunityData = createValidCommunityData();
      expect(validCommunityData).toBeDefined();
      expect(validCommunityData.id).toBeDefined();
    });

    it('When I try to create a community with a name longer than 200 characters', () => {
      // Arrange
      const validCommunityData = createValidCommunityData();
      const passport = createMockPassport({ canManageCommunitySettings: true });
      // biome-ignore lint/plugin/no-type-assertion: test file
      const createdBy = {} as EndUserEntityReference;

      // Create a name longer than 200 characters (201 characters)
      const invalidCommunityName = generateStringOfLength(201);

      // Act & Assert
      let creationError: Error | null = null;
      let createdCommunity: Community<CommunityProps> | null = null;

      try {
        createdCommunity = Community.getNewInstance(
          validCommunityData,
          invalidCommunityName,
          createdBy,
          passport,
        );
      } catch (error) {
        // biome-ignore lint/plugin/no-type-assertion: test file
        creationError = error as Error;
      }

      // Then the community creation should fail
      expect(creationError).toBeDefined();
      expect(createdCommunity).toBeNull();

      // And I should receive an error message containing "Too long"
      expect(creationError?.message).toBeDefined();
      expect(creationError?.message).not.toBeNull();
      expect(creationError?.message).toContain('Too long');
    });
  });

  describe('Scenario: Allowing community creation with valid name', () => {
    let creationError: Error | null = null;
    let createdCommunity: Community<CommunityProps> | null = null;

    it('Given I am an authorized user with community management permissions', () => {
      // Setup: Create a user with community management permissions
      const passport = createMockPassport({ canManageCommunitySettings: true });
      expect(passport).toBeDefined();
    });

    it('Given I have valid community data', () => {
      // Setup: Create valid community data structure
      const validCommunityData = createValidCommunityData();
      expect(validCommunityData).toBeDefined();
      expect(validCommunityData.id).toBeDefined();
    });

    it('When I attempt to create a community named "Valid Community Name"', () => {
      // Arrange
      const validCommunityData = createValidCommunityData();
      const passport = createMockPassport({ canManageCommunitySettings: true });
      // biome-ignore lint/plugin/no-type-assertion: test file
      const createdBy = {} as EndUserEntityReference;

      // Create a valid community name
      const validCommunityName = 'Valid Community Name';

      // Act

      try {
        createdCommunity = Community.getNewInstance(
          validCommunityData,
          validCommunityName,
          createdBy,
          passport,
        );
      } catch (error) {
        // biome-ignore lint/plugin/no-type-assertion: test file
        creationError = error as Error;
      }

      // Then the community creation should succeed
      expect(creationError).toBeNull();
      expect(createdCommunity).toBeDefined();
    });

    it('Then the community "Valid Community Name" should be created successfully', () => {
      // Assert
      expect(creationError).toBeNull();
      expect(createdCommunity).toBeDefined();
      expect(createdCommunity?.name).toBe('Valid Community Name');
    });
  });
});