import type { FC } from 'react';
import { StaffRouteShell } from '@ocom/ui-staff-shared';

export const SectionLayout: FC = () => {
	return (
		<StaffRouteShell
			title="Community Management"
			description="Community management route package mounted under /staff/community."
		/>
	);
};
