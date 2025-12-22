import { Descriptions, Typography, theme } from 'antd';
import type { AdminCommunityDetailContainerCommunityFieldsFragment } from '../../../../generated.tsx';

const { Text, Title } = Typography;

export interface CommunityDetailProps {
	data: AdminCommunityDetailContainerCommunityFieldsFragment;
}

export const CommunityDetail: React.FC<CommunityDetailProps> = (props) => {
	const whiteLabelDetails = () => {
		if (props.data.whiteLabelDomain) {
			return (
				<Descriptions.Item label="White Label Name">
					<Text strong>{props.data.whiteLabelDomain}</Text>
				</Descriptions.Item>
			);
		}
		return <></>;
	};

	const domainDetails = () => {
		if (props.data.domain) {
			return (
				<Descriptions.Item label="Domain Name">
					<Text strong>{props.data.domain}</Text>
				</Descriptions.Item>
			);
		}
		return <></>;
	};

	const handleDetails = () => {
		if (props.data.handle) {
			return (
				<Descriptions.Item label="Handle Name">
					<Text strong>{props.data.handle}</Text>
				</Descriptions.Item>
			);
		}
		return <></>;
	};

	const {
		token: { colorText, colorBgContainer },
	} = theme.useToken();

	return (
		<div>
			<div
				className={'w-full p-5 mx-auto my-5 shadow-lg rounded-lg border border-1'}
				style={{
					color: colorText,
					backgroundColor: colorBgContainer,
				}}
			>
				<Title level={3}>Community Admin</Title>
				<p>
					You can manage different aspects of your community here. The items in
					menu to the left reflect the permissions you have in managing this
					community.
				</p>
			</div>

			<Descriptions column={1}>
				<Descriptions.Item label="Community ID">
					<Text strong data-testid="community-id">
						{props.data.id}
					</Text>
				</Descriptions.Item>
				<Descriptions.Item label="Community Name">
					<Text strong data-testid="community-name">
						{props.data.name}
					</Text>
				</Descriptions.Item>
				{whiteLabelDetails()}
				{domainDetails()}
				{handleDetails()}
			</Descriptions>
		</div>
	);
};
