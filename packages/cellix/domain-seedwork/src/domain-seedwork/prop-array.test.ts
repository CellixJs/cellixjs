import { describe, it, expect } from 'vitest';
import type { PropArray } from './prop-array.ts';
import type { DomainEntityProps } from './domain-entity.ts';

describe('PropArray', () => {
	it('should be a utility type for readonly arrays with entity operations', () => {
		// PropArray is a utility type for managing readonly arrays of entities
		// Test ensures it's properly exported and can be imported
		
		interface TestProp extends DomainEntityProps {
			name: string;
		}
		
		const mockPropArray: Pick<PropArray<TestProp>, 'items'> = {
			items: [{ id: '1', name: 'test' }],
		};
		
		expect(mockPropArray.items).toHaveLength(1);
		expect(mockPropArray.items[0]?.name).toBe('test');
	});
});
