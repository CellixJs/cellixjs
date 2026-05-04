import { StaffRouteShell } from '@ocom/ui-staff-shared';
import type { FC } from 'react';

export const SectionLayout: FC = () => {
	return (
		<StaffRouteShell
			title="Finance"
			description="Finance route package mounted under /staff/finance."
		/>
	);
};
