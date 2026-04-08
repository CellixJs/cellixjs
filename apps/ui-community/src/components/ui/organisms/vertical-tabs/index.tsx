import { Col, Menu, Row, theme } from 'antd';
import { useMemo } from 'react';
import type { RouteObject } from 'react-router-dom';
import { Link, Route, Routes, matchRoutes, useLocation } from 'react-router-dom';

export interface RouteDefinition {
	id: string;
	link: string;
	path: string;
	title: string;
	icon: React.ReactNode;
	element: React.ReactNode;
}

export interface VerticalTabsProps {
	pages: RouteDefinition[];
}

export const VerticalTabs: React.FC<VerticalTabsProps> = ({ pages }) => {
	const location = useLocation();

	const convertedRoutes = useMemo(() => {
		return pages.map(
			(page) =>
				({
					id: page.id,
					path: page.path,
				}) as RouteObject,
		);
	}, [pages]);

	const matchedPages = matchRoutes(convertedRoutes, location);
	const matchedIds = matchedPages ? matchedPages.map((match) => match.route.id?.toString() || '') : [];

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
				<Menu
					mode="inline"
					selectedKeys={matchedIds}
				>
					{pages.map((page) => (
						<Menu.Item
							key={page.id}
							icon={page.icon}
						>
							<Link to={page.link}>{page.title}</Link>
						</Menu.Item>
					))}
				</Menu>
			</Col>
			<Col
				flex="auto"
				style={{ paddingLeft: '24px' }}
			>
				<Routes>
					{pages.map((page) => (
						<Route
							key={page.id}
							path={page.path}
							element={page.element}
						/>
					))}
				</Routes>
			</Col>
		</Row>
	);
};
