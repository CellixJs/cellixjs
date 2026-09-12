import type { EventBus } from '@cellix/domain-seedwork/event-bus';
import { MongooseSeedwork } from '@cellix/mongoose-seedwork';
import type { Community } from '@ocom/data-sources-mongoose-models/community';
import type { Member } from '@ocom/data-sources-mongoose-models/member';
import type { Property, PropertyModelType } from '@ocom/data-sources-mongoose-models/property';
import type { Domain } from '@ocom/domain';
import type { ClientSession } from 'mongoose';
import { describe, expect, it, vi } from 'vitest';
import { PropertyConverter } from './property.domain-adapter.ts';
import { PropertyRepository } from './property.repository.ts';

const OWNER_ID = '507f1f77bcf86cd799439099';

function makeCommunityDoc(overrides: Partial<Community> = {}) {
	return { id: '507f1f77bcf86cd799439012', name: 'Test Community', ...overrides } as Community;
}

function makeMemberDoc(overrides: Partial<Member> = {}) {
	return { id: OWNER_ID, memberName: 'Owner Member', ...overrides } as Member;
}

type MockedPropertyDoc = Property & {
	save: ReturnType<typeof vi.fn>;
	populate: ReturnType<typeof vi.fn>;
	isModified: ReturnType<typeof vi.fn>;
};

function makePropertyDoc(overrides: Partial<Property> = {}): MockedPropertyDoc {
	const doc = {
		id: '507f1f77bcf86cd799439011',
		propertyName: 'Test Property',
		community: makeCommunityDoc(),
		owner: null,
		isDeleted: false,
		isModified: vi.fn(() => true),
		set(key: keyof Property, value: unknown) {
			(this as Property)[key] = value as never;
		},
		...overrides,
	} as unknown as MockedPropertyDoc;
	doc.save = vi.fn(async () => doc);
	// Mirrors mongoose populate: resolves ObjectId refs into their documents.
	doc.populate = vi.fn((paths: string | string[]) => {
		const pathList = Array.isArray(paths) ? paths : [paths];
		if (pathList.includes('owner')) {
			doc.owner = makeMemberDoc() as never;
		}
		if (pathList.includes('community')) {
			doc.community = makeCommunityDoc() as never;
		}
		return Promise.resolve(doc);
	}) as never;
	return doc;
}

function makeMockPassport() {
	return {
		community: {
			forCommunity: vi.fn(() => ({
				determineIf: vi.fn(() => true),
			})),
		},
		property: {
			forProperty: vi.fn(() => ({
				determineIf: (fn: (permissions: { canManageProperties: boolean; canEditOwnProperty: boolean; isEditingOwnProperty: boolean; isSystemAccount: boolean }) => boolean) =>
					fn({ canManageProperties: true, canEditOwnProperty: true, isEditingOwnProperty: false, isSystemAccount: false }),
			})),
		},
	} as unknown as Domain.Passport;
}

function makeRepo(propertyDoc: Property) {
	const converter = new PropertyConverter();
	const passport = makeMockPassport();
	const ModelMock = function (this: Property) {
		Object.assign(this, makePropertyDoc());
	};
	Object.assign(ModelMock, {
		findById: vi.fn(() => ({
			populate: vi.fn().mockReturnThis(),
			session: vi.fn().mockReturnThis(),
			exec: vi.fn(async () => propertyDoc),
		})),
	});
	const eventBus = { dispatch: vi.fn() } as unknown as EventBus;
	const session = {} as ClientSession;
	const repo = new PropertyRepository(passport, ModelMock as unknown as PropertyModelType, converter, eventBus, session);
	return repo;
}

/**
 * The committed aggregate returned by save() is used directly as the GraphQL
 * mutation payload, so refs written as raw ObjectIds (e.g. a reassigned
 * owner) must be resolved before the payload serializes owner/community.
 */
describe('PropertyRepository save populates unresolved refs', () => {
	it('populates refs stored as ObjectIds so the returned aggregate can resolve them', async () => {
		const propertyDoc = makePropertyDoc({ owner: new MongooseSeedwork.ObjectId(OWNER_ID) as never });
		const repo = makeRepo(propertyDoc);

		const property = await repo.getById('507f1f77bcf86cd799439011');
		const saved = await repo.save(property);

		expect(propertyDoc.populate).toHaveBeenCalledWith(['owner']);
		expect(saved.owner?.id).toBe(OWNER_ID);
	});

	it('does not re-populate refs that are already resolved documents', async () => {
		const propertyDoc = makePropertyDoc({ owner: makeMemberDoc() as never });
		const repo = makeRepo(propertyDoc);

		const property = await repo.getById('507f1f77bcf86cd799439011');
		const saved = await repo.save(property);

		expect(propertyDoc.populate).not.toHaveBeenCalled();
		expect(saved.owner?.id).toBe(OWNER_ID);
	});

	it('skips populate on the soft-delete save path', async () => {
		const propertyDoc = makePropertyDoc({ owner: new MongooseSeedwork.ObjectId(OWNER_ID) as never });
		const repo = makeRepo(propertyDoc);

		const property = await repo.getById('507f1f77bcf86cd799439011');
		property.requestDelete();
		await repo.save(property);

		expect(propertyDoc.populate).not.toHaveBeenCalled();
	});
});
