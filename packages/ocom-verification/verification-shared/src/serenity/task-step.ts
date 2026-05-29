import { Task } from '@serenity-js/core';

export class TaskStep extends Task {
	constructor(
		description: string,
		private readonly action: (actor: unknown) => Promise<void>,
	) {
		super(description);
	}

	performAs(actor: unknown): Promise<void> {
		return this.action(actor);
	}
}
