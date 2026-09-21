import type { Domain } from '@ocom/domain';

/**
 * Reads a community's finance value object through its entity-reference contract.
 *
 * `CommunityEntityReference.finance` is declared with the persistence-facing
 * {@link Domain.Contexts.Community.Community.CommunityFinanceProps} shape because
 * sibling aggregates (member, role, property) embed community props directly. The
 * aggregate getter returns a CommunityFinance value object, so the runtime shape is
 * the entity reference. This helper keeps that single conversion in one documented
 * place instead of repeating casts at every call site.
 */
export const financeOf = (community: Domain.Contexts.Community.Community.CommunityEntityReference): Domain.Contexts.Community.Community.CommunityFinanceEntityReference =>
	community.finance as unknown as Domain.Contexts.Community.Community.CommunityFinanceEntityReference;
