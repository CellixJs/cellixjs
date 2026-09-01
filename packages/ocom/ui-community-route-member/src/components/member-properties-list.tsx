import { PropertyList, type PropertyRecord } from '@ocom/ui-community-shared';
import type React from 'react';

interface MemberPropertiesListProps {
	data: readonly PropertyRecord[];
	onPropertyView?: (propertyId: string) => void;
	loading?: boolean | undefined;
}

/** Member directory presentation deliberately excludes the manager Owner column. */
export const MemberPropertiesList: React.FC<MemberPropertiesListProps> = (props) => (
	<PropertyList
		data={props.data}
		onPropertyView={props.onPropertyView}
		loading={props.loading}
		showOwner={false}
	/>
);
