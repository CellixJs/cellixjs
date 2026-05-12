import { Spin } from 'antd';
import { Navigate } from 'react-router-dom';
import { useStaffPermissions } from '../../../../hooks/use-staff-permissions.ts';

export const AuthLanding: React.FC = () => {
	const { permissions, loading, error } = useStaffPermissions();

	if (loading) {
		return (
			<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
				<Spin size="large" />
			</div>
		);
	}

	if (error) {
		return (
			<Navigate
				to="/unauthorized"
				replace
			/>
		);
	}

	let targetRoute = '/unauthorized';
	if (permissions?.canManageTechAdmin) {
		targetRoute = '/staff/tech';
	} else if (permissions?.canManageFinance) {
		targetRoute = '/staff/finance';
	} else if (permissions?.canManageCommunities) {
		targetRoute = '/staff/community-management';
	} else if (permissions?.canManageUsers) {
		targetRoute = '/staff/user-management';
	}

	return (
		<Navigate
			to={targetRoute}
			replace
		/>
	);
};
