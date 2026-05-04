import type { FC } from 'react';
import { StaffRouteShell } from './staff-route-shell.tsx';

export const SectionLayout: FC = () => {
	return (
		<StaffRouteShell
			title="Staff Portal"
			description="Bootstrap shell for staff routes. Choose a section from the left to load its route package."
		/>
	);
};
