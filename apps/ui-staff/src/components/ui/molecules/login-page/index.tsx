import { Button, Card, Col, Row, Space, Spin, Typography } from 'antd';
import type { FC } from 'react';
import { useAuth } from 'react-oidc-context';
import { Navigate } from 'react-router-dom';

const { Title, Paragraph } = Typography;

export const LoginPage: FC = () => {
	const auth = useAuth();

	if (auth.isLoading || auth.activeNavigator) {
		return (
			<Row
				justify="center"
				style={{ height: '100vh', alignItems: 'center' }}
			>
				<Space
					direction="vertical"
					size="large"
					style={{ textAlign: 'center' }}
				>
					<Spin size="large" />
					<Title level={2}>Please wait...</Title>
				</Space>
			</Row>
		);
	}

	if (auth.isAuthenticated) {
		return (
			<Navigate
				to="/staff/community"
				replace
			/>
		);
	}

	return (
		<Row
			justify="center"
			align="middle"
			style={{ minHeight: '100vh', background: '#f0f2f5' }}
		>
			<Col
				xs={22}
				sm={16}
				md={10}
				lg={8}
				xl={6}
			>
				<Card
					style={{
						borderRadius: 12,
						boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
						textAlign: 'center',
					}}
				>
					<Space
						direction="vertical"
						size="large"
						style={{ width: '100%' }}
					>
						<div>
							<Title
								level={2}
								style={{ margin: 0 }}
							>
								Staff Portal
							</Title>
							<Paragraph
								type="secondary"
								style={{ marginTop: 8 }}
							>
								Sign in to access the CellixJS staff dashboard.
							</Paragraph>
						</div>

						{auth.error && <Paragraph type="danger">Sign-in failed: {auth.error.message}</Paragraph>}

						<Button
							type="primary"
							size="large"
							block
							onClick={() => auth.signinRedirect()}
						>
							Sign In
						</Button>
					</Space>
				</Card>
			</Col>
		</Row>
	);
};
