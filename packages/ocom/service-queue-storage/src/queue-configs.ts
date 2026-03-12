/**
 * Queue Configuration Types
 * 
 * Defines payload schemas and types for all Owner Community queues
 */

import type { JSONSchemaType } from 'ajv';

/**
 * Payload for community-created outbound queue
 */
export interface CommunityCreatedPayload {
	communityId: string;
	name: string;
	createdAt: string;
}

/**
 * JSON Schema for CommunityCreatedPayload
 */
export const communityCreatedSchema: JSONSchemaType<CommunityCreatedPayload> = {
	type: 'object',
	properties: {
		communityId: { type: 'string' },
		name: { type: 'string' },
		createdAt: { type: 'string' },
	},
	required: ['communityId', 'name', 'createdAt'],
	additionalProperties: false,
};

/**
 * Payload for member update inbound queue
 */
export interface MemberUpdatePayload {
	memberId: string;
	updates: {
		firstName?: string;
		lastName?: string;
		email?: string;
	};
}

/**
 * JSON Schema for MemberUpdatePayload
 */
export const memberUpdateSchema: JSONSchemaType<MemberUpdatePayload> = {
	type: 'object',
	properties: {
		memberId: { type: 'string' },
		updates: {
			type: 'object',
			properties: {
				firstName: { type: 'string', nullable: true },
				lastName: { type: 'string', nullable: true },
				email: { type: 'string', nullable: true },
			},
			required: [],
			additionalProperties: false,
		},
	},
	required: ['memberId', 'updates'],
	additionalProperties: false,
};
