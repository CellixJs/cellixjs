import { Task, the } from '@serenity-js/core';
import { FillPropertyForm, type PropertyFormFields } from '../interactions/fill-property-form.ts';
import { OpenCreatePropertyForm } from '../interactions/open-create-property-form.ts';
import { OpenPropertiesList } from '../interactions/open-properties-list.ts';
import { RecordBaselinePropertyNames } from '../interactions/record-property-notes.ts';
import { SubmitPropertyCreate } from '../interactions/submit-property-create.ts';

/**
 * Task that creates a property through the admin UI, recording the baseline
 * property names for negative-path assertions before submitting.
 */
export const CreatePropertyViaForm = (fields: PropertyFormFields) =>
	Task.where(
		the`#actor creates a property named "${fields.propertyName ?? ''}"`,
		OpenPropertiesList(),
		RecordBaselinePropertyNames(),
		OpenCreatePropertyForm(),
		FillPropertyForm(fields),
		SubmitPropertyCreate(fields.propertyName ?? ''),
	);
