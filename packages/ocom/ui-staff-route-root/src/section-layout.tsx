import { ImpendingMessage, MaintenanceMessage, useMaintenanceMessage } from '@ocom/ui-shared';
import { Skeleton } from 'antd';
import { Header } from './components/header.tsx';
import { LoginPage } from './pages/login-page.tsx';

export const SectionLayout: React.FC = () => {
	const { isImpending, isMaintenance } = useMaintenanceMessage();
	return (
		<div>
			<Header />
			{isMaintenance === undefined ? (
				<Skeleton />
			) : isMaintenance ? (
				<MaintenanceMessage />
			) : isImpending === undefined ? (
				<Skeleton />
			) : isImpending ? (
				<>
					<ImpendingMessage isRootPage />
					<LoginPage />
				</>
			) : (
				<LoginPage />
			)}
		</div>
	);
};
