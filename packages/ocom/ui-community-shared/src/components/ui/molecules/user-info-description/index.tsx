import { Typography } from 'antd';

const { Text } = Typography;

export interface UserInfoDescriptionProps {
	label?: string | undefined;
	value?: string | undefined;
	className?: string | undefined;
}

export const UserInfoDescription: React.FC<UserInfoDescriptionProps> = ({ label = 'User ID', value, className }) => {
	return (
		<div className={className}>
			<Text className="block font-outfit text-oc-caption font-bold uppercase mb-oc-xs">
				{label}
			</Text>
			<Text className="block text-oc-body">
				{value ?? 'Unknown'}
			</Text>
		</div>
	);
};
