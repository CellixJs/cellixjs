import type { FC } from 'react';
import { StaffRouteShell } from '@ocom/ui-staff-route-shared';

export const SectionLayout: FC = () => {
	return (
		<StaffRouteShell
			title="Finance"
			description="Finance route package mounted under /staff/finance."
		/>
	);
};
