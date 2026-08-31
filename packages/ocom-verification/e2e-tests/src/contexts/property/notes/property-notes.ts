/** Scenario-local property E2E state shared between tasks and questions via actor notes. */
export interface PropertyE2ENotes {
	/** Admin portal base path (`/community/:communityId/admin/:memberId`) of the managed community. */
	adminBasePath: string;
	/** Property names listed before a create attempt, for negative-path checks. */
	baselinePropertyNames: string[];
	/** Outcome of the last property operation submitted through the UI. */
	lastPropertyStatus: 'SUCCESS' | 'VALIDATION_ERROR' | 'ERROR' | null;
	/** Error captured from the last property operation, if any. */
	lastPropertyError: string | null;
	/** Flat field table submitted with the last full-field property create. */
	submittedPropertyFields: Record<string, string>;
}
