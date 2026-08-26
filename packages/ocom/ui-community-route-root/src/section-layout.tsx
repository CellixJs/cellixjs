import { ImpendingMessage, MaintenanceMessage, useMaintenanceMessage } from '@ocom/ui-shared';
import { Skeleton } from 'antd';
import { Header } from './components/header.tsx';
import { CmsPage } from './pages/cms-page.tsx';

export const SectionLayout: React.FC = () => {
	const { isImpending, isMaintenance } = useMaintenanceMessage();
	return (
		<div>
			<Header />
			{isMaintenance === undefined ? (
				<Skeleton />
			) : isMaintenance ? (
				<MaintenanceMessage portalKey="UI_COMMUNITY_PORTAL" />
			) : isImpending === undefined ? (
				<Skeleton />
			) : isImpending ? (
				<>
					<ImpendingMessage
						isRootPage
						portalKey="UI_COMMUNITY_PORTAL"
					/>
					<CmsPage />
				</>
			) : (
				<CmsPage />
			)}
		</div>
	);
};
