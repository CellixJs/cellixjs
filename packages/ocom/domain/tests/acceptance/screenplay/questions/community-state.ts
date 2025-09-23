import { Question } from '@serenity-js/core';
import { CommunityCreationResults } from '../interactions/create-community.ts';

/**
 * Questions about community state and creation results
 * Following Serenity/JS Screenplay pattern standards
 */
export const CommunityState = {

  /**
   * Checks if a community was successfully created
   */
  wasCreated: () => {
    return Question.about('whether community was created', () => {
      return CommunityCreationResults.createdCommunity !== null;
    });
  },

  /**
   * Checks if community creation failed
   */
  creationFailed: () => {
    return Question.about('whether community creation failed', () => {
      return CommunityCreationResults.creationError !== null;
    });
  },

  /**
   * Gets the created community
   */
  createdCommunity: () => {
    return Question.about('the created community', () => {
      return CommunityCreationResults.createdCommunity;
    });
  },

  /**
   * Gets the creation error
   */
  creationError: () => {
    return Question.about('the creation error', () => {
      return CommunityCreationResults.creationError;
    });
  },

  /**
   * Checks if the error message contains specific text
   */
  errorMessageContains: (expectedMessage: string) => {
    return Question.about(`whether error message contains "${expectedMessage}"`, () => {
      const error = CommunityCreationResults.creationError;
      return error?.message.includes(expectedMessage) ?? false;
    });
  },

  /**
   * Gets the name of the created community
   */
  createdCommunityName: () => {
    return Question.about('the name of the created community', () => {
      const community = CommunityCreationResults.createdCommunity;
      return community ? community.name : null;
    });
  },

  /**
   * Checks if the community has the expected name
   */
  hasName: (expectedName: string) => {
    return Question.about(`whether community has name "${expectedName}"`, () => {
      const community = CommunityCreationResults.createdCommunity;
      return community !== null && community.name === expectedName;
    });
  }
};