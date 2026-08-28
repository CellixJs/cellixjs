import { StaffAuthContext } from '@ocom/ui-staff-shared';
import { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { QueueExplorerContainer } from '../components/queue-explorer.container.tsx';

export const QueueExplorerPage: React.FC = () => {
	const auth = useContext(StaffAuthContext);

	if (auth?.permissions?.canViewQueues !== true) {
		return (
			<Navigate
				to="/unauthorized"
				replace
			/>
		);
	}

	return <QueueExplorerContainer canSendQueueMessages={auth.permissions.canSendQueueMessages === true} />;
};
