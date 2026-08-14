import { Task, the } from '@serenity-js/core';
import { AddAdditionalAmenityRow, AddBedroomDetailRow } from '../interactions/add-dynamic-list-rows.ts';
import { FillPropertyFieldTable } from '../interactions/fill-property-field-table.ts';
import { OpenCreatePropertyForm } from '../interactions/open-create-property-form.ts';
import { OpenPropertiesList } from '../interactions/open-properties-list.ts';
import { OpenPropertyDetail } from '../interactions/open-property-detail.ts';
import { RecordBaselinePropertyNames } from '../interactions/record-property-notes.ts';
import { SelectPropertyOwner } from '../interactions/select-property-owner.ts';
import { SubmitPropertyCreateExpectingList } from '../interactions/submit-property-create-expecting-list.ts';
import { SubmitPropertySave } from '../interactions/submit-property-save.ts';

/**
 * Task that creates a property through the admin UI providing the full field
 * set in one pass. The create flow is expected to land back on the properties
 * list, so no detail navigation is awaited.
 */
export const CreatePropertyWithFullFieldsViaForm = (details: Record<string, string>) =>
	Task.where(
		the`#actor creates the property "${details['propertyName'] ?? ''}" with the full field set`,
		OpenPropertiesList(),
		RecordBaselinePropertyNames(),
		OpenCreatePropertyForm(),
		FillPropertyFieldTable(details),
		SubmitPropertyCreateExpectingList(details['propertyName'] ?? ''),
	);

/**
 * Task that updates a focused slice of the property field set through the
 * admin detail form.
 */
export const UpdatePropertyFieldsViaForm = (propertyName: string, details: Record<string, string>, activity: string) =>
	Task.where(the`#actor ${activity} of the property "${propertyName}"`, OpenPropertyDetail(propertyName), FillPropertyFieldTable(details), SubmitPropertySave());

/**
 * Task that assigns the property owner through the Owner member select on the
 * admin detail form.
 */
export const SetPropertyOwnerViaForm = (propertyName: string, memberName: string) =>
	Task.where(the`#actor sets the owner of the property "${propertyName}" to "${memberName}"`, OpenPropertyDetail(propertyName), SelectPropertyOwner(memberName), SubmitPropertySave());

/**
 * Task that adds a bedroom detail row to a property through the admin detail form.
 */
export const AddBedroomDetailViaForm = (propertyName: string, roomName: string, bedDescriptions: string) =>
	Task.where(the`#actor adds the bedroom detail "${roomName}" to the property "${propertyName}"`, OpenPropertyDetail(propertyName), AddBedroomDetailRow(roomName, bedDescriptions), SubmitPropertySave());

/**
 * Task that adds an additional amenity category row to a property through the
 * admin detail form.
 */
export const AddAdditionalAmenityViaForm = (propertyName: string, category: string, amenities: string) =>
	Task.where(the`#actor adds the additional amenity category "${category}" to the property "${propertyName}"`, OpenPropertyDetail(propertyName), AddAdditionalAmenityRow(category, amenities), SubmitPropertySave());
