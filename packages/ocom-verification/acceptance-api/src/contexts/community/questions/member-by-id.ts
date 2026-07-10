import { GraphQLClient } from '@cellix/serenity-framework/clients/graphql';
import { type Actor, type AnswersQuestions, Question, type UsesAbilities } from '@serenity-js/core';
import { MEMBER_BY_ID_QUERY } from '../../../shared/graphql/member-operations.ts';

export interface MemberByIdResult {
	id?: string;
	memberName?: string;
	community?: {
		id?: string;
	};
	profile?: {
		name?: string;
		email?: string;
		bio?: string;
		avatarDocumentId?: string;
		interests?: string[];
		showInterests?: boolean;
		showEmail?: boolean;
		showProfile?: boolean;
		showLocation?: boolean;
		showProperties?: boolean;
	};
}

export class MemberById extends Question<Promise<MemberByIdResult | undefined>> {
	constructor(private readonly memberId: string) {
		super(`member by id "${memberId}"`);
	}

	static withId(memberId: string): MemberById {
		return new MemberById(memberId);
	}

	override async answeredBy(actor: AnswersQuestions & UsesAbilities): Promise<MemberByIdResult | undefined> {
		const graphql = GraphQLClient.as(actor as unknown as Actor);
		const response = await graphql.execute(MEMBER_BY_ID_QUERY, {
			id: this.memberId,
		});

		const member = response.data?.['member'] as Record<string, unknown> | undefined;
		if (!member) {
			return undefined;
		}

		const profile = member['profile'] as Record<string, unknown> | undefined;
		const interests = Array.isArray(profile?.['interests']) ? (profile?.['interests'] as Array<unknown>).map((value) => String(value)).filter((value) => value.length > 0) : undefined;

		return {
			id: member['id'] !== undefined ? String(member['id']) : undefined,
			memberName: member['memberName'] !== undefined ? String(member['memberName']) : undefined,
			community: {
				id: (member['community'] as Record<string, unknown> | undefined)?.['id'] !== undefined ? String((member['community'] as Record<string, unknown>)['id']) : undefined,
			},
			profile: profile
				? {
						...(profile['name'] !== undefined ? { name: String(profile['name'] ?? '') } : {}),
						...(profile['email'] !== undefined ? { email: String(profile['email'] ?? '') } : {}),
						...(profile['bio'] !== undefined ? { bio: String(profile['bio'] ?? '') } : {}),
						...(profile['avatarDocumentId'] !== undefined ? { avatarDocumentId: String(profile['avatarDocumentId'] ?? '') } : {}),
						...(interests !== undefined ? { interests } : {}),
						...(profile['showInterests'] !== undefined ? { showInterests: Boolean(profile['showInterests']) } : {}),
						...(profile['showEmail'] !== undefined ? { showEmail: Boolean(profile['showEmail']) } : {}),
						...(profile['showProfile'] !== undefined ? { showProfile: Boolean(profile['showProfile']) } : {}),
						...(profile['showLocation'] !== undefined ? { showLocation: Boolean(profile['showLocation']) } : {}),
						...(profile['showProperties'] !== undefined ? { showProperties: Boolean(profile['showProperties']) } : {}),
					}
				: undefined,
		};
	}
}
