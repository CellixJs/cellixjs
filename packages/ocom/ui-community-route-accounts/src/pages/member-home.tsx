import { useQuery } from '@apollo/client';
import { ComponentQueryLoader } from '@cellix/ui-core';
import { Descriptions, Typography, theme } from 'antd';
import type React from 'react';
import { useParams } from 'react-router-dom';
import { type MemberHomeContainerMemberFieldsFragment, MemberHomeContainerMemberForCurrentCommunityDocument } from '../generated.tsx';

const { Text, Title } = Typography;

interface MemberDetailProps {
	data: MemberHomeContainerMemberFieldsFragment;
}

const MemberDetail: React.FC<MemberDetailProps> = ({ data }) => {
	const {
		token: { colorText, colorBgContainer },
	} = theme.useToken();

	return (
		<div>
			<div
				className="w-full p-5 mx-auto my-5 shadow-lg rounded-lg border border-1"
				style={{ color: colorText, backgroundColor: colorBgContainer }}
			>
				<Title level={3}>Community Member</Title>
				<p>Welcome to your community portal. Use the navigation on the left to access your profile and other community features.</p>
			</div>

			<Descriptions column={1}>
				<Descriptions.Item label="Member ID">
					<Text
						strong
						data-testid="member-id"
					>
						{data.id}
					</Text>
				</Descriptions.Item>
				<Descriptions.Item label="Member Name">
					<Text
						strong
						data-testid="member-name"
					>
						{data.memberName ?? '—'}
					</Text>
				</Descriptions.Item>
				<Descriptions.Item label="Community">
					<Text
						strong
						data-testid="community-name"
					>
						{data.community?.name ?? '—'}
					</Text>
				</Descriptions.Item>
			</Descriptions>
		</div>
	);
};

const MemberHomeContainer: React.FC = () => {
	const params = useParams();
	// biome-ignore lint:useLiteralKeys
	const communityId = params['communityId'] ?? '';

	const { data, loading, error } = useQuery(MemberHomeContainerMemberForCurrentCommunityDocument, {
		variables: { communityId },
		skip: !communityId,
	});

	return (
		<ComponentQueryLoader
			loading={loading}
			hasData={data?.memberForCurrentCommunity}
			hasDataComponent={<MemberDetail data={data?.memberForCurrentCommunity as MemberHomeContainerMemberFieldsFragment} />}
			error={error}
		/>
	);
};

export const MemberHome: React.FC = () => {
	const {
		token: { colorTextBase },
	} = theme.useToken();

	return (
		<div style={{ padding: '24px' }}>
			<Title
				level={4}
				style={{ color: colorTextBase }}
			>
				Home
			</Title>
			<MemberHomeContainer />
		</div>
	);
};
