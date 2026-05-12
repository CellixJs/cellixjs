import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import type { MemberInvitationModelType } from '@ocom/data-sources-mongoose-models/member/member-invitation';
import type { Domain } from '@ocom/domain';
import { expect, vi } from 'vitest';
import { getMemberInvitationUnitOfWork } from './member-invitation.uow.ts';

const test = { for: describeFeature };
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feature = await loadFeature(path.resolve(__dirname, 'features/member-invitation.uow.feature'));

function makeMockMemberInvitationModel() {
	return {
		findById: vi.fn(),
		find: vi.fn(),
		create: vi.fn(),
		updateOne: vi.fn(),
		deleteOne: vi.fn(),
	} as unknown as MemberInvitationModelType;
}

function makeMockPassport() {
	return {
		community: {
			forCommunity: vi.fn(() => ({
				determineIf: vi.fn(() => true),
			})),
		},
		user: {
			forEndUser: vi.fn(() => ({
				determineIf: vi.fn(() => true),
			})),
		},
	} as unknown as Domain.Passport;
}

test.for(feature, ({ Scenario, Background, BeforeEachScenario }) => {
	let memberInvitationModel: MemberInvitationModelType;
	let passport: Domain.Passport;
	let result: Domain.Contexts.Community.Member.MemberInvitationUnitOfWork;

	BeforeEachScenario(() => {
		memberInvitationModel = makeMockMemberInvitationModel();
		passport = makeMockPassport();
		result = {} as Domain.Contexts.Community.Member.MemberInvitationUnitOfWork;
	});

	Background(({ Given, And }) => {
		Given('a valid MemberInvitation Mongoose model', () => {
			// Setup is done in BeforeEachScenario
		});

		And('a valid passport for domain operations', () => {
			// Setup is done in BeforeEachScenario
		});
	});

	Scenario('Creating a MemberInvitation Unit of Work', ({ When, Then, And }) => {
		When('I call getMemberInvitationUnitOfWork with the MemberInvitation model and passport', () => {
			result = getMemberInvitationUnitOfWork(memberInvitationModel, passport);
		});

		Then('I should receive a properly initialized MemberInvitationUnitOfWork', () => {
			expect(result).toBeDefined();
			expect(typeof result).toBe('object');
		});

		And('the Unit of Work should have the correct repository type', () => {
			expect(result).toHaveProperty('withTransaction');
			expect(typeof result.withTransaction).toBe('function');
		});

		And('the Unit of Work should have the correct converter type', () => {
			expect(result).toHaveProperty('withScopedTransaction');
			expect(typeof result.withScopedTransaction).toBe('function');
		});

		And('the Unit of Work should have the correct event buses', () => {
			expect(result).toHaveProperty('withScopedTransactionById');
			expect(typeof result.withScopedTransactionById).toBe('function');
		});
	});
});
