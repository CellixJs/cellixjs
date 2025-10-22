import {
  VOString,
  VOSet
} from '@lucaspaganini/value-objects';

export const ActivityTypeCodes = {
  Created: 'CREATED',
  Submitted: 'SUBMITTED',
  Assigned: 'ASSIGNED',
  Updated: 'UPDATED',
  InProgress: 'INPROGRESS',
  Completed: 'COMPLETED',
  Closed: 'CLOSED'
}

export class Description extends VOString({ trim: true, maxLength: 2000 }) { }
export class ActivityTypeCode extends VOSet(Object.values(ActivityTypeCodes)) { }