import type { FC } from 'react';
import { StaffRouteShell } from '@ocom/ui-staff-route-shared';

export const SectionLayout: FC = () => {
	return (
		<StaffRouteShell
			title="Tech Admin"
			description="Tech admin route package mounted under /staff/tech."
		/>
	);
};
