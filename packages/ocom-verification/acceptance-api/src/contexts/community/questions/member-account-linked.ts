import { type AnswersQuestions, Question, type UsesAbilities } from '@serenity-js/core';
import { MemberById } from './member-by-id.ts';

export class MemberAccountLinked extends Question<Promise<boolean>> {
	constructor(
		private readonly memberId: string,
		private readonly endUserId: string,
	) {
		super(`whether member "${memberId}" is linked to end user "${endUserId}"`);
	}

	static for(memberId: string, endUserId: string): MemberAccountLinked {
		return new MemberAccountLinked(memberId, endUserId);
	}

	override async answeredBy(actor: AnswersQuestions & UsesAbilities): Promise<boolean> {
		const member = await actor.answer(MemberById.withId(this.memberId));
		return member?.accounts?.some((account) => account.user?.id === this.endUserId) ?? false;
	}
}

export class MemberAccountCount extends Question<Promise<number>> {
	constructor(
		private readonly memberId: string,
		private readonly endUserId: string,
	) {
		super(`the number of links from member "${memberId}" to end user "${endUserId}"`);
	}

	static for(memberId: string, endUserId: string): MemberAccountCount {
		return new MemberAccountCount(memberId, endUserId);
	}

	override async answeredBy(actor: AnswersQuestions & UsesAbilities): Promise<number> {
		const member = await actor.answer(MemberById.withId(this.memberId));
		return member?.accounts?.filter((account) => account.user?.id === this.endUserId).length ?? 0;
	}
}
