export type MemberPropertyBrowserVisitor = 'own-editor' | 'manager' | 'no-permission' | 'no-role' | 'nonaccepted' | 'guest' | 'mismatched-route';

/** Scenario-local state used by the member Property browser flows. */
export interface MemberPropertyE2ENotes {
	visitor: MemberPropertyBrowserVisitor;
	communityId: string;
	managerMemberId: string;
	ownMemberId: string;
	routeMemberId: string;
	memberBasePath: string;
	adminBasePath: string;
	memberPropertyIds: Record<string, string>;
	lastOperationStatus?: 'SUCCESS' | 'FAILURE';
	lastOperationError?: string;
}
