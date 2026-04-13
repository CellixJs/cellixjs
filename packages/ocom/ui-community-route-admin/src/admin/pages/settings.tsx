import { PageHeader } from '@ant-design/pro-layout';
import { theme } from 'antd';
import { SubPageLayout } from '../sub-page-layout.tsx';
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
			<SettingsGeneral />
		</SubPageLayout>
	);
};
