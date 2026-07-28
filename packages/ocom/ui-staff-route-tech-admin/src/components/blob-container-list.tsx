import { List, Spin } from 'antd';
import type React from 'react';

export interface BlobContainerListProps {
	containers: { name: string }[];
	onSelect: (name: string) => void;
	loading?: boolean;
}

export const BlobContainerList: React.FC<BlobContainerListProps> = ({ containers, onSelect, loading }) => {
	if (loading) {
		return <Spin />;
	}

	return (
		<List
			bordered
			dataSource={containers}
			renderItem={(container) => (
				<List.Item
					style={{ cursor: 'pointer' }}
					onClick={() => onSelect(container.name)}
				>
					{container.name}
				</List.Item>
			)}
		/>
	);
};
