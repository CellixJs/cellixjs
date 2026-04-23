import { setWorldConstructor, World } from '@cucumber/cucumber';
import { type Cast, serenity } from '@serenity-js/core';
import { CellixUiCast } from './shared/support/cast.ts';

export class CellixUiWorld extends World {
	private cast!: Cast;

	override init(): Promise<void> {
		this.cast = new CellixUiCast();
		serenity.engage(this.cast);
		return Promise.resolve();
	}
}

setWorldConstructor(CellixUiWorld);
