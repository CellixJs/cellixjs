import type { Actor } from '@serenity-js/core';
import type { Passport } from '../../../../src/domain/contexts/passport.ts';
import { createMockPassport } from '../../support/community-test-utils.ts';

/**
 * Ability to manage communities within the system
 * Following Serenity/JS Screenplay pattern standards
 */
export class ManageCommunities {
  
  constructor(private readonly passport: Passport) {}

  /**
   * Creates an ability with full community management permissions
   */
  static withFullPermissions(): ManageCommunities {
    const passport = createMockPassport({
      canManageCommunitySettings: true,
      canCreateCommunities: true,
      canManageMembers: true,
      canManageSiteContent: true,
      isSystemAccount: true
    });
    
    return new ManageCommunities(passport);
  }

  /**
   * Creates an ability with limited community management permissions
   */
  static withLimitedPermissions(): ManageCommunities {
    const passport = createMockPassport({
      canManageCommunitySettings: true,
      canCreateCommunities: true,
      canManageMembers: true,
      canManageSiteContent: false,
      isSystemAccount: false
    });
    
    return new ManageCommunities(passport);
  }

  /**
   * Creates an ability with basic permissions (read-only)
   */
  static withBasicPermissions(): ManageCommunities {
    const passport = createMockPassport({
      canManageCommunitySettings: false,
      canCreateCommunities: false,
      canManageMembers: false,
      canManageSiteContent: false,
      isSystemAccount: false
    });
    
    return new ManageCommunities(passport);
  }

  /**
   * Creates an ability with no permissions
   */
  static withNoPermissions(): ManageCommunities {
    const passport = createMockPassport({});
    return new ManageCommunities(passport);
  }

  /**
   * Gets the passport for authentication and authorization
   */
  getPassport(): Passport {
    return this.passport;
  }

  /**
   * Gets the ability from an actor (simplified approach)
   */
  static as(actor: Actor): ManageCommunities {
    // Store the ability on the actor object for retrieval
    const actorWithAbility = actor as Actor & { manageCommunities?: ManageCommunities };
    if (!actorWithAbility.manageCommunities) {
      throw new Error(`Actor ${actor.name} does not have the ManageCommunities ability`);
    }
    return actorWithAbility.manageCommunities;
  }

  /**
   * Attach this ability to an actor
   */
  static attachTo(actor: Actor, ability: ManageCommunities): Actor {
    const actorWithAbility = actor as Actor & { manageCommunities?: ManageCommunities };
    actorWithAbility.manageCommunities = ability;
    return actor;
  }
}