import type { EventBus } from '@cellix/domain-seedwork/event-bus';
import type { Community } from '@ocom/data-sources-mongoose-models/community';
import type { Property, PropertyModelType } from '@ocom/data-sources-mongoose-models/property';
import { Domain } from '@ocom/domain';
import type { ClientSession } from 'mongoose';
import { describe, expect, it, vi } from 'vitest';
import { PropertyConverter } from './property.domain-adapter.ts';
import { PropertyRepository } from './property.repository.ts';

function makeCommunityDoc(overrides: Partial<Community> = {}) {
	return { id: '507f1f77bcf86cd799439012', name: 'Test Community', ...overrides } as Community;
}

function makePropertyDoc(overrides: Partial<Property> = {}) {
	const doc = {
		id: '507f1f77bcf86cd799439011',
		propertyName: 'Test Property',
		community: makeCommunityDoc(),
		isDeleted: false,
		isModified: vi.fn(() => true),
		save: vi.fn(),
		set(key: keyof Property, value: unknown) {
			(this as Property)[key] = value as never;
		},
		...overrides,
	} as unknown as Property & { save: ReturnType<typeof vi.fn>; isModified: ReturnType<typeof vi.fn> };
	doc.save = vi.fn(async () => doc);
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
	const deleteOneExec = vi.fn(async () => ({ deletedCount: 1 }));
	const ModelMock = function (this: Property) {
		Object.assign(this, makePropertyDoc());
	};
	Object.assign(ModelMock, {
		findById: vi.fn(() => ({
			populate: vi.fn().mockReturnThis(),
			exec: vi.fn(async () => propertyDoc),
		})),
		deleteOne: vi.fn(() => ({ exec: deleteOneExec })),
	});
	const dispatch = vi.fn();
	const eventBus = { dispatch } as unknown as EventBus;
	const session = {} as ClientSession;
	const repo = new PropertyRepository(passport, ModelMock as unknown as PropertyModelType, converter, eventBus, session);
	return { repo, passport, converter, dispatch, deleteOne: (ModelMock as unknown as { deleteOne: ReturnType<typeof vi.fn> }).deleteOne };
}

describe('PropertyRepository save soft delete', () => {
	it('persists a requested deletion as a soft delete instead of removing the document', async () => {
		const propertyDoc = makePropertyDoc();
		const { repo, deleteOne } = makeRepo(propertyDoc);

		const property = await repo.getById('507f1f77bcf86cd799439011');
		property.requestDelete();
		const saved = await repo.save(property);

		expect(deleteOne).not.toHaveBeenCalled();
		expect(propertyDoc.isDeleted).toBe(true);
		expect(propertyDoc.save).toHaveBeenCalledTimes(1);
		expect(saved.id).toBe('507f1f77bcf86cd799439011');
	});

	it('keeps the deletion integration event available for the unit of work', async () => {
		const propertyDoc = makePropertyDoc();
		const { repo } = makeRepo(propertyDoc);

		const property = await repo.getById('507f1f77bcf86cd799439011');
		property.requestDelete();
		await repo.save(property);

		const integrationEvents = repo.getIntegrationEvents();
		expect(integrationEvents).toHaveLength(1);
		expect(integrationEvents[0]?.payload).toEqual({ id: '507f1f77bcf86cd799439011' });
	});

	it('saves a non-deleted property without marking it deleted', async () => {
		const propertyDoc = makePropertyDoc();
		const { repo, deleteOne } = makeRepo(propertyDoc);

		const property = await repo.getById('507f1f77bcf86cd799439011');
		const saved = await repo.save(property);

		expect(deleteOne).not.toHaveBeenCalled();
		expect(propertyDoc.isDeleted).toBe(false);
		expect(propertyDoc.save).toHaveBeenCalledTimes(1);
		expect(saved).toBeInstanceOf(Domain.Contexts.Property.Property.Property);
	});
});
