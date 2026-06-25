import { type PerformsActivities, Task } from '@serenity-js/core';

/**
 * Serenity task backed by an inline async action.
 *
 * Use `TaskStep` to keep domain step/task code expressive while avoiding small
 * helper functions that only bridge Serenity's `Task` contract.
 */
export class TaskStep<TActor extends PerformsActivities = PerformsActivities> extends Task {
	/**
	 * @param description Serenity report description for the task.
	 * @param action Action executed when the actor performs the task.
	 */
	constructor(
		description: string,
		private readonly action: (actor: TActor) => Promise<void> | void,
	) {
		super(description);
	}

	/**
	 * Execute the configured action for the supplied actor.
	 *
	 * @param actor Actor provided by Serenity/JS.
	 */
	async performAs(actor: PerformsActivities): Promise<void> {
		await this.action(actor as TActor);
	}
}
