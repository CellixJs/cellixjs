import type { FC } from 'react';
import { StaffRouteShell } from '@ocom/ui-staff-route-shared';

export const SectionLayout: FC = () => {
	return (
		<StaffRouteShell
			title="Staff Home"
			description="Welcome to the staff bootstrap app. This root route composes the staff sections exposed by dedicated route packages."
		/>
	);
};
