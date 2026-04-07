import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { MongooseSeedwork } from '@cellix/mongoose-seedwork';
import type { MemberInvitation } from '@ocom/data-sources-mongoose-models/member/member-invitation';
import type { EndUser } from '@ocom/data-sources-mongoose-models/user/end-user';
import type { Domain } from '@ocom/domain';
import { expect } from 'vitest';
import { EndUserDomainAdapter } from '../../user/end-user/end-user.domain-adapter.ts';
import { MemberInvitationDomainAdapter } from './member-invitation.domain-adapter.ts';

const test = { for: describeFeature };
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feature = await loadFeature(path.resolve(__dirname, 'features/member-invitation.domain-adapter.feature'));

function makeMemberInvitationDoc(overrides: Partial<MemberInvitation> = {}): MemberInvitation {
	const futureDate = new Date();
	futureDate.setDate(futureDate.getDate() + 7);
	return {
		communityId: 'comm-1',
		email: 'test@example.com',
		message: 'Hello',
		status: 'PENDING',
		expiresAt: futureDate,
		invitedBy: undefined,
		acceptedBy: undefined,
		createdAt: new Date('2024-01-01'),
		updatedAt: new Date('2024-01-02'),
		set(key: keyof MemberInvitation, value: unknown) {
			(this as MemberInvitation)[key] = value as never;
		},
		...overrides,
	} as unknown as MemberInvitation;
}

function makeEndUserDoc(id = '507f1f77bcf86cd799439013'): EndUser {
	return { id, externalId: 'ext-1' } as unknown as EndUser;
}

test.for(feature, ({ Scenario, Background, BeforeEachScenario }) => {
	let doc: MemberInvitation;
	let adapter: MemberInvitationDomainAdapter;

	BeforeEachScenario(() => {
		doc = makeMemberInvitationDoc();
		adapter = new MemberInvitationDomainAdapter(doc);
	});

	Background(({ Given }) => {
		Given('a valid Mongoose MemberInvitation document with communityId "comm-1", email "test@example.com", message "Hello", status "PENDING", and a future expiresAt', () => {
			// Setup in BeforeEachScenario
		});
	});

	Scenario('Getting and setting the communityId property', ({ Given, When, Then }) => {
		Given('a MemberInvitationDomainAdapter for the document', () => {
			/* empty */
		});

		When('I get the communityId property', () => {
			/* empty */
		});

		Then('it should return "comm-1"', () => {
			expect(adapter.communityId).toBe('comm-1');
		});

		When('I set the communityId property to "comm-2"', () => {
			adapter.communityId = 'comm-2';
		});

		Then('the document\'s communityId should be "comm-2"', () => {
			expect(doc.communityId).toBe('comm-2');
		});
	});

	Scenario('Getting and setting the email property', ({ Given, When, Then }) => {
		Given('a MemberInvitationDomainAdapter for the document', () => {
			/* empty */
		});

		When('I get the email property', () => {
			/* empty */
		});

		Then('it should return "test@example.com"', () => {
			expect(adapter.email).toBe('test@example.com');
		});

		When('I set the email property to "new@example.com"', () => {
			adapter.email = 'new@example.com';
		});

		Then('the document\'s email should be "new@example.com"', () => {
			expect(doc.email).toBe('new@example.com');
		});
	});

	Scenario('Getting and setting the message property', ({ Given, When, Then }) => {
		Given('a MemberInvitationDomainAdapter for the document', () => {
			/* empty */
		});

		When('I get the message property', () => {
			/* empty */
		});

		Then('it should return "Hello"', () => {
			expect(adapter.message).toBe('Hello');
		});

		When('I set the message property to "Updated message"', () => {
			adapter.message = 'Updated message';
		});

		Then('the document\'s message should be "Updated message"', () => {
			expect(doc.message).toBe('Updated message');
		});
	});

	Scenario('Getting message when document message is undefined', ({ Given, When, Then }) => {
		Given('a MemberInvitationDomainAdapter for a document with no message', () => {
			const docWithoutMessage = makeMemberInvitationDoc();
			// biome-ignore lint/performance/noDelete: needed to test undefined message scenario
			delete (docWithoutMessage as unknown as Record<string, unknown>)['message'];
			doc = docWithoutMessage;
			adapter = new MemberInvitationDomainAdapter(doc);
		});

		When('I get the message property', () => {
			/* empty */
		});

		Then('it should return an empty string', () => {
			expect(adapter.message).toBe('');
		});
	});

	Scenario('Getting and setting the status property', ({ Given, When, Then }) => {
		Given('a MemberInvitationDomainAdapter for the document', () => {
			/* empty */
		});

		When('I get the status property', () => {
			/* empty */
		});

		Then('it should return "PENDING"', () => {
			expect(adapter.status).toBe('PENDING');
		});

		When('I set the status property to "SENT"', () => {
			adapter.status = 'SENT';
		});

		Then('the document\'s status should be "SENT"', () => {
			expect(doc.status).toBe('SENT');
		});
	});

	Scenario('Getting and setting the expiresAt property', ({ Given, When, Then }) => {
		const originalDate = new Date();
		originalDate.setDate(originalDate.getDate() + 7);

		Given('a MemberInvitationDomainAdapter for the document', () => {
			doc = makeMemberInvitationDoc({ expiresAt: originalDate });
			adapter = new MemberInvitationDomainAdapter(doc);
		});

		When('I get the expiresAt property', () => {
			/* empty */
		});

		Then("it should return the document's expiresAt date", () => {
			expect(adapter.expiresAt).toEqual(originalDate);
		});

		When('I set the expiresAt property to a new future date', () => {
			const newDate = new Date();
			newDate.setDate(newDate.getDate() + 14);
			adapter.expiresAt = newDate;
		});

		Then("the document's expiresAt should be updated", () => {
			expect(doc.expiresAt).not.toEqual(originalDate);
		});
	});

	Scenario('Getting invitedBy when it is a populated EndUser document', ({ Given, When, Then }) => {
		Given('a MemberInvitationDomainAdapter for a document with a populated invitedBy EndUser', () => {
			doc = makeMemberInvitationDoc({ invitedBy: makeEndUserDoc() as unknown as MemberInvitation['invitedBy'] });
			adapter = new MemberInvitationDomainAdapter(doc);
		});

		When('I get the invitedBy property', () => {
			/* empty */
		});

		Then('it should return an EndUserDomainAdapter instance', () => {
			expect(adapter.invitedBy).toBeInstanceOf(EndUserDomainAdapter);
		});
	});

	Scenario('Getting invitedBy when it is an unpopulated ObjectId', ({ Given, When, Then }) => {
		Given('a MemberInvitationDomainAdapter for a document with invitedBy as an ObjectId "507f1f77bcf86cd799439011"', () => {
			const oid = new MongooseSeedwork.ObjectId('507f1f77bcf86cd799439011');
			doc = makeMemberInvitationDoc({ invitedBy: oid as unknown as MemberInvitation['invitedBy'] });
			adapter = new MemberInvitationDomainAdapter(doc);
		});

		When('I get the invitedBy property', () => {
			/* empty */
		});

		Then('it should return a stub with id "507f1f77bcf86cd799439011"', () => {
			expect(adapter.invitedBy.id).toBe('507f1f77bcf86cd799439011');
		});
	});

	Scenario('Getting invitedBy when it is not set', ({ Given, When, Then }) => {
		Given('a MemberInvitationDomainAdapter for a document with no invitedBy', () => {
			doc = makeMemberInvitationDoc({ invitedBy: undefined });
			adapter = new MemberInvitationDomainAdapter(doc);
		});

		When('I try to get the invitedBy property', () => {
			/* empty */
		});

		Then('an error should be thrown indicating invitedBy is not populated', () => {
			expect(() => adapter.invitedBy).toThrow('invitedBy is not populated');
		});
	});

	Scenario('Setting invitedBy with a valid entity reference', ({ Given, When, Then }) => {
		Given('a MemberInvitationDomainAdapter for the document', () => {
			/* empty */
		});

		When('I set the invitedBy property to an entity reference with id "507f1f77bcf86cd799439011"', () => {
			adapter.invitedBy = { id: '507f1f77bcf86cd799439011' } as Domain.Contexts.User.EndUser.EndUserEntityReference;
		});

		Then("the document's invitedBy should be set to the corresponding ObjectId", () => {
			expect(doc.invitedBy).toBeDefined();
		});
	});

	Scenario('Getting acceptedBy when it is undefined', ({ Given, When, Then }) => {
		Given('a MemberInvitationDomainAdapter for a document with no acceptedBy', () => {
			doc = makeMemberInvitationDoc({ acceptedBy: undefined });
			adapter = new MemberInvitationDomainAdapter(doc);
		});

		When('I get the acceptedBy property', () => {
			/* empty */
		});

		Then('it should return undefined', () => {
			expect(adapter.acceptedBy).toBeUndefined();
		});
	});

	Scenario('Getting acceptedBy when it is an unpopulated ObjectId', ({ Given, When, Then }) => {
		Given('a MemberInvitationDomainAdapter for a document with acceptedBy as an ObjectId "507f1f77bcf86cd799439012"', () => {
			const oid = new MongooseSeedwork.ObjectId('507f1f77bcf86cd799439012');
			doc = makeMemberInvitationDoc({ acceptedBy: oid as unknown as MemberInvitation['acceptedBy'] });
			adapter = new MemberInvitationDomainAdapter(doc);
		});

		When('I get the acceptedBy property', () => {
			/* empty */
		});

		Then('it should return a stub with id "507f1f77bcf86cd799439012"', () => {
			expect(adapter.acceptedBy?.id).toBe('507f1f77bcf86cd799439012');
		});
	});

	Scenario('Getting acceptedBy when it is a populated EndUser document', ({ Given, When, Then }) => {
		Given('a MemberInvitationDomainAdapter for a document with a populated acceptedBy EndUser', () => {
			doc = makeMemberInvitationDoc({ acceptedBy: makeEndUserDoc('507f1f77bcf86cd799439014') as unknown as MemberInvitation['acceptedBy'] });
			adapter = new MemberInvitationDomainAdapter(doc);
		});

		When('I get the acceptedBy property', () => {
			/* empty */
		});

		Then('it should return an EndUserDomainAdapter instance', () => {
			expect(adapter.acceptedBy).toBeInstanceOf(EndUserDomainAdapter);
		});
	});

	Scenario('Setting acceptedBy to undefined clears the field', ({ Given, When, Then }) => {
		Given('a MemberInvitationDomainAdapter for the document', () => {
			/* empty */
		});

		When('I set the acceptedBy property to undefined', () => {
			adapter.acceptedBy = undefined;
		});

		Then("the document's acceptedBy should be undefined", () => {
			expect(doc.acceptedBy).toBeUndefined();
		});
	});

	Scenario('Setting acceptedBy with a valid entity reference', ({ Given, When, Then }) => {
		Given('a MemberInvitationDomainAdapter for the document', () => {
			/* empty */
		});

		When('I set the acceptedBy property to an entity reference with id "507f1f77bcf86cd799439012"', () => {
			adapter.acceptedBy = { id: '507f1f77bcf86cd799439012' } as Domain.Contexts.User.EndUser.EndUserEntityReference;
		});

		Then("the document's acceptedBy should be set to the corresponding ObjectId", () => {
			expect(doc.acceptedBy).toBeDefined();
		});
	});

	Scenario('Getting createdAt and updatedAt', ({ Given, When, Then }) => {
		Given('a MemberInvitationDomainAdapter for the document', () => {
			/* empty */
		});

		When('I get the createdAt property', () => {
			/* empty */
		});

		Then("it should return the document's createdAt date", () => {
			expect(adapter.createdAt).toEqual(new Date('2024-01-01'));
		});

		When('I get the updatedAt property', () => {
			/* empty */
		});

		Then("it should return the document's updatedAt date", () => {
			expect(adapter.updatedAt).toEqual(new Date('2024-01-02'));
		});
	});
});
