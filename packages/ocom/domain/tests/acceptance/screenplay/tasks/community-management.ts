import { type Actor, Task } from '@serenity-js/core';
import { CreateCommunity } from '../interactions/create-community.ts';

/**
 * Task for community management operations
 * Following Serenity/JS Screenplay pattern standards
 */
export class CommunityManagement extends Task {
  
  private constructor(private readonly interaction: CreateCommunity) {
    super(`#actor manages community`);
  }

  /**
   * Creates a new community with valid data
   */
  static createCommunityNamed(name: string): CommunityManagement {
    return new CommunityManagement(CreateCommunity.withName(name));
  }

  /**
   * Attempts to create a community with invalid name (too long)
   */
  static createCommunityWithInvalidName(maxLength: number): CommunityManagement {
    return new CommunityManagement(CreateCommunity.withInvalidName(maxLength));
  }

  /**
   * Attempts to create a community with name at the character limit
   */
  static createCommunityWithNameAtLimit(maxLength: number): CommunityManagement {
    return new CommunityManagement(CreateCommunity.withNameAtLimit(maxLength));
  }

  /**
   * Performs the task by executing the associated interaction
   */
  performAs(actor: Actor): Promise<void> {
    return actor.attemptsTo(this.interaction);
  }

  /**
   * Returns a human-readable description of this task
   */
  toString(): string {
    return `manage community operations`;
  }
}