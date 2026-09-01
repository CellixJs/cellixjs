type MemberPropertyOperationStatus = 'SUCCESS' | 'REJECTED' | 'ERROR' | null;
type MemberPropertyReadStatus = 'FOUND' | 'MISSING' | 'ERROR' | null;

/** Scenario-local state for member Property API behavior. */
export interface MemberPropertyNotes {
	activeCommunityId: string;
	activeCommunityName: string;
	actingMemberId: string;
	managerMemberId: string;
	foreignMemberId: string | null;
	knownPropertyIds: Record<string, string>;
	listedPropertyNames: string[];
	directoryStatus: MemberPropertyOperationStatus;
	directoryError: string | null;
	lastOperationStatus: MemberPropertyOperationStatus;
	lastOperationError: string | null;
	lastReadStatus: MemberPropertyReadStatus;
	lastReadError: string | null;
	lastReadPropertyId: string | null;
	baselinePropertyNames: string[];
}
