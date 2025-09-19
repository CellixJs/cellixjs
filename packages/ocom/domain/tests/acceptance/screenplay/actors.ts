import { type Actor, actorCalled, type Cast } from '@serenity-js/core';
import { ManageCommunities } from './abilities/manage-communities.ts';

/**
 * Cast of actors for community management scenarios
 * Following Serenity/JS Screenplay pattern standards
 */
export class CommunityManagementCast implements Cast {
  
  /**
   * Prepares an actor with the specified name and abilities
   */
  prepare(actor: Actor): Actor {
    const actorName = actor.name;
    
    let ability: ManageCommunities;
    switch (actorName) {
      case 'System Administrator':
      case 'Admin':
        ability = ManageCommunities.withFullPermissions();
        break;
      
      case 'Community Manager':
        ability = ManageCommunities.withLimitedPermissions();
        break;
      
      case 'Regular User':
        ability = ManageCommunities.withNoPermissions();
        break;
      
      default:
        ability = ManageCommunities.withBasicPermissions();
        break;
    }
    
    return ManageCommunities.attachTo(actor, ability);
  }
}

/**
 * Convenience functions for creating common actors
 */
export const Actors = {
  systemAdministrator: () => {
    const actor = actorCalled('System Administrator');
    return ManageCommunities.attachTo(actor, ManageCommunities.withFullPermissions());
  },
  
  communityManager: () => {
    const actor = actorCalled('Community Manager');
    return ManageCommunities.attachTo(actor, ManageCommunities.withLimitedPermissions());
  },
  
  regularUser: () => {
    const actor = actorCalled('Regular User');
    return ManageCommunities.attachTo(actor, ManageCommunities.withNoPermissions());
  },
  
  named: (name: string) => {
    const actor = actorCalled(name);
    return ManageCommunities.attachTo(actor, ManageCommunities.withBasicPermissions());
  }
};