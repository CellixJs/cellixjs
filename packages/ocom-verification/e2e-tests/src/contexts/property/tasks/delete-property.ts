import { Task, the } from '@serenity-js/core';
import { ConfirmPropertyRemoval } from '../interactions/confirm-property-removal.ts';
import { OpenPropertyDetail } from '../interactions/open-property-detail.ts';

/**
 * Task that removes a property through the admin detail page's confirmation
 * modal.
 */
export const DeletePropertyViaConfirm = (propertyName: string) => Task.where(the`#actor deletes the property "${propertyName}"`, OpenPropertyDetail(propertyName), ConfirmPropertyRemoval());
