import type { FC } from 'react';
import { StaffRouteShell } from '@ocom/ui-staff-shared';

export const SectionLayout: FC = () => {
	return (
		<StaffRouteShell
			title="User Management"
			description="User management route package mounted under /staff/users."
		/>
	);
};
