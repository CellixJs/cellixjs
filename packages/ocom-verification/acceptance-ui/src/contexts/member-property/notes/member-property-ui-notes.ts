import type { MemberPropertyUiVisitor } from '../abilities/mock-member-property-backend.ts';

/** Scenario-local member route state for DOM acceptance tests. */
export interface MemberPropertyUiNotes {
	visitor: MemberPropertyUiVisitor;
	memberPropertyRoute: string;
}
