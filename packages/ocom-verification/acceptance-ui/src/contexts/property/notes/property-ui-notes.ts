/** Scenario-local property UI state shared between tasks and questions via actor notes. */
export interface PropertyUiNotes {
	baselinePropertyCount: number;
	submittedPropertyFields: Record<string, string>;
}
