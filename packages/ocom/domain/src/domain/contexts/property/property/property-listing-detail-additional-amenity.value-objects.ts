import { VOArray, VOString } from '@lucaspaganini/value-objects';

export class Category extends VOString({
	trim: true,
	maxLength: 100,
	minLength: 1,
}) {}

class Amenity extends VOString({ trim: true, maxLength: 100 }) {}
export class Amenities extends VOArray(Amenity, { maxLength: 20 }) {}
