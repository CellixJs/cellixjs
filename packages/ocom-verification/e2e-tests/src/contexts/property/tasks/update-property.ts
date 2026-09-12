import { Task, the } from '@serenity-js/core';
import { FillPropertyForm, type PropertyFormFields } from '../interactions/fill-property-form.ts';
import { OpenPropertyDetail } from '../interactions/open-property-detail.ts';
import { SubmitPropertySave } from '../interactions/submit-property-save.ts';

/**
 * Task that updates a property through the admin detail form.
 */
export const UpdatePropertyViaForm = (propertyName: string, fields: PropertyFormFields) =>
	Task.where(the`#actor updates the property "${propertyName}"`, OpenPropertyDetail(propertyName), FillPropertyForm(fields), SubmitPropertySave());
