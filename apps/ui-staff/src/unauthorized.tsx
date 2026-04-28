import type React from 'react';
import { Row, Button, Typography } from 'antd';
import { Link } from 'react-router-dom';

export const Unauthorized: React.FC = () => {
	return (
		<Row style={{ padding: 40 }}>
			<div>
				<Typography.Title level={2}>Unauthorized</Typography.Title>
				<Typography.Paragraph>You do not have permission to view this page.</Typography.Paragraph>
				<Button type="primary">
					<Link to="/">Return home</Link>
				</Button>
			</div>
		</Row>
	);
};
