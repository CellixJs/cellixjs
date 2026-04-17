import { Card, Descriptions, Typography } from 'antd';
import dayjs from 'dayjs';

const { Title } = Typography;

export interface MemberProfileData {
	id: string;
	memberName: string | null;
	profile: {
		name: string | null;
		email: string | null;
		bio: string | null;
		showInterests: boolean | null;
		showEmail: boolean | null;
		showProfile: boolean | null;
		showLocation: boolean | null;
		showProperties: boolean | null;
	} | null;
	createdAt: Date | string;
	updatedAt: Date | string;
}

interface MemberProfileViewProps {
	data: MemberProfileData | null;
	isAdmin: boolean;
}

export const MemberProfileView: React.FC<MemberProfileViewProps> = ({ data, isAdmin }) => {
	if (!data) {
		return <div>No member data available</div>;
	}

	const profile = data.profile;

	return (
		<Card title={<Title level={3}>Member Profile</Title>}>
			<Descriptions
				column={1}
				bordered
			>
				<Descriptions.Item label="Member Name">{data.memberName || 'Not set'}</Descriptions.Item>
				{profile && (
					<>
						<Descriptions.Item label="Display Name">{profile.name || 'Not set'}</Descriptions.Item>
						<Descriptions.Item label="Email">{profile.email || 'Not set'}</Descriptions.Item>
						<Descriptions.Item label="Bio">{profile.bio || 'Not set'}</Descriptions.Item>
						<Descriptions.Item label="Show Interests">{profile.showInterests ? 'Yes' : 'No'}</Descriptions.Item>
						<Descriptions.Item label="Show Email">{profile.showEmail ? 'Yes' : 'No'}</Descriptions.Item>
						<Descriptions.Item label="Show Profile">{profile.showProfile ? 'Yes' : 'No'}</Descriptions.Item>
						<Descriptions.Item label="Show Location">{profile.showLocation ? 'Yes' : 'No'}</Descriptions.Item>
						<Descriptions.Item label="Show Properties">{profile.showProperties ? 'Yes' : 'No'}</Descriptions.Item>
					</>
				)}
				<Descriptions.Item label="Member Since">{dayjs(data.createdAt).format('MMMM DD, YYYY')}</Descriptions.Item>
				{isAdmin && <Descriptions.Item label="Last Updated">{dayjs(data.updatedAt).format('MMMM DD, YYYY HH:mm')}</Descriptions.Item>}
			</Descriptions>
		</Card>
	);
};
