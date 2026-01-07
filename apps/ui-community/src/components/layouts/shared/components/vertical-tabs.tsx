import { Col, Menu, Row, theme } from 'antd';
import {
	Link,
	Route,
	Routes,
	useLocation,
	matchPath,
} from 'react-router-dom';
import { useMemo } from 'react';

export interface RouteDefinition {
	id: string;
	link: string;
	path: string;
	title: string;
	icon: React.ReactNode;
	element: React.ReactNode;
}

export const VerticalTabs: React.FC<{ pages: RouteDefinition[] }> = ({
	pages,
}) => {
	const location = useLocation();

	// Find which page matches the current location
	const matchedIds = useMemo(() => {
		const matched: string[] = [];
		for (const page of pages) {
			if (matchPath(page.path, location.pathname)) {
				matched.push(page.id);
			}
		}
		return matched;
	}, [pages, location.pathname]);

	const {
		token: { colorTextBase },
	} = theme.useToken();

	return (
		<Row
			wrap={false}
			style={{
				color: colorTextBase,
			}}
		>
			<Col flex="none">
				<Menu mode="inline" selectedKeys={matchedIds}>
					{pages.map((page) => (
						<Menu.Item key={page.id} icon={page.icon}>
							<Link to={page.link}>{page.title}</Link>
						</Menu.Item>
					))}
				</Menu>
			</Col>
			<Col flex="auto" style={{ paddingLeft: '24px' }}>
				<Routes>
					{pages.map((page) => (
						<Route key={page.id} path={page.path} element={page.element} />
					))}
				</Routes>
			</Col>
		</Row>
	);
};
