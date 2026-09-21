import { PageHeader } from '@ant-design/pro-layout';
import { theme } from 'antd';
import { Route, Routes } from 'react-router-dom';
import { SubPageLayout } from '../sub-page-layout.tsx';
import { SettingsBilling } from './settings-billing.tsx';
import { SettingsGeneral } from './settings-general.tsx';

export const Settings: React.FC = () => {
	const {
		token: { colorTextBase },
	} = theme.useToken();

	return (
		<SubPageLayout
			fixedHeader={false}
			header={
				<PageHeader
					title={
						<span
							style={{
								color: colorTextBase,
							}}
						>
							Community Settings
						</span>
					}
				/>
			}
		>
			<Routes>
				<Route
					path=""
					element={<SettingsGeneral />}
				/>
				<Route
					path="billing"
					element={<SettingsBilling />}
				/>
			</Routes>
		</SubPageLayout>
	);
};
