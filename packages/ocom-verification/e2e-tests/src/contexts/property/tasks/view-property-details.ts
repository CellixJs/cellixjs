import { Task, the } from '@serenity-js/core';
import { OpenPropertyDetail } from '../interactions/open-property-detail.ts';

/**
 * Task that opens the detail form of a property from the properties list.
 */
export const ViewPropertyDetails = (propertyName: string) => Task.where(the`#actor views the details of the property "${propertyName}"`, OpenPropertyDetail(propertyName));
