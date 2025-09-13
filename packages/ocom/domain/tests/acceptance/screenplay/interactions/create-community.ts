import { type Actor, type AnswersQuestions, Interaction, type UsesAbilities } from '@serenity-js/core';
import { Community, type CommunityProps } from '../../../../src/domain/contexts/community/community/community.ts';
import type { EndUserEntityReference } from '../../../../src/domain/contexts/user/end-user/end-user.ts';
import { generateStringOfLength } from '../../support/community-test-utils.ts';
import { ManageCommunities } from '../abilities/manage-communities.ts';

// Global storage for test results (simplified approach)
export const CommunityCreationResults = {
  createdCommunity: null as Community<CommunityProps> | null,
  creationError: null as Error | null
};

/**
 * Interaction to create a community with valid data
 * Following Serenity/JS Screenplay pattern standards
 */
export class CreateCommunity extends Interaction {
  
  private constructor(
    private readonly communityData: CommunityProps,
    private readonly communityName: string,
    private readonly createdBy: EndUserEntityReference
  ) {
    super(`#actor creates community "${communityName}"`);
  }

  /**
   * Creates a community with the specified name
   */
  static withName(name: string): CreateCommunity {
    const communityData = {
      id: '12345',
      name: '',
      domain: '',
      whiteLabelDomain: null,
      handle: null,
      createdBy: {} as EndUserEntityReference,
      createdAt: new Date(),
      updatedAt: new Date(),
      schemaVersion: '1.0.0',
    } as CommunityProps;

    const createdBy = {} as EndUserEntityReference;
    
    return new CreateCommunity(communityData, name, createdBy);
  }

  /**
   * Creates a community with an invalid name (too long)
   */
  static withInvalidName(maxLength: number): CreateCommunity {
    const invalidName = generateStringOfLength(maxLength);
    return CreateCommunity.withName(invalidName);
  }

  /**
   * Creates a community with a name that's exactly at the limit
   */
  static withNameAtLimit(maxLength: number): CreateCommunity {
    const limitName = generateStringOfLength(maxLength);
    return CreateCommunity.withName(limitName);
  }

  /**
   * Performs the interaction
   */
  performAs(actor: UsesAbilities & AnswersQuestions): Promise<void> {
    const ability = ManageCommunities.as(actor as Actor);
    const passport = ability.getPassport();

    try {
      const community = Community.getNewInstance(
        this.communityData,
        this.communityName,
        this.createdBy,
        passport,
      );
      
      // Store the result for later verification
      CommunityCreationResults.createdCommunity = community;
      CommunityCreationResults.creationError = null;
      
    } catch (error) {
      // Store the error for later verification
      CommunityCreationResults.creationError = error instanceof Error 
      ? error 
      : new Error(`Unknown error: ${String(error)}`);
      CommunityCreationResults.createdCommunity = null;
    }

    return Promise.resolve();
  }

  /**
   * Returns a human-readable description of this interaction
   */
  toString(): string {
    return `create community with name "${this.communityName}"`;
  }
}