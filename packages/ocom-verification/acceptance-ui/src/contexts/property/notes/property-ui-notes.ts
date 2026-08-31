/** Scenario-local property UI state shared between tasks and questions via actor notes. */
export interface PropertyUiNotes {
	baselinePropertyCount: number;
	submittedPropertyFields: Record<string, string>;
	/** Update-request count recorded just before a form submission, for no-request assertions. */
	updateCallCountBeforeSubmit: number;
}
