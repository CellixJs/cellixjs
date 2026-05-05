import { type Actor, Cast, Notepad, TakeNotes } from '@serenity-js/core';

/**
 * Cast for acceptance-ui tests — each actor gets a Notepad to share
 * state between steps.  No server abilities needed because UI tests
 * render React components directly in jsdom.
 */
export class CellixUiCast extends Cast {
	prepare(actor: Actor): Actor {
		return actor.whoCan(TakeNotes.using(Notepad.empty()));
	}
}
