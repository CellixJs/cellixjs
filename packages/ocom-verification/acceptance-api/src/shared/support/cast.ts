import { type Actor, type Cast, Notepad, TakeNotes } from '@serenity-js/core';
import { GraphQLClient } from '../abilities/graphql-client.ts';

export class CellixApiCast implements Cast {
	constructor(private readonly apiUrl: string) {}

	prepare(actor: Actor): Actor {
		return actor.whoCan(TakeNotes.using(Notepad.empty()), GraphQLClient.at(this.apiUrl));
	}
}
