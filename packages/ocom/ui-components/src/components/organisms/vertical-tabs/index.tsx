import { Col, Menu, Row, theme } from 'antd';
import { useMemo } from 'react';
import type { Location, RouteObject } from 'react-router-dom';
import { Link, Route, Routes, matchRoutes, useLocation } from 'react-router-dom';
import type React from 'react';

interface RouteDefinition {
	id: string;
	link: string;
	path: string;
	title: string;
	icon: React.ReactNode;
	element: React.ReactNode;
}

interface VerticalTabsProps {
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

	// Compute a stable base path for tabs by stripping any of the known tab segments
	// from the current pathname. This avoids building links that nest under the
	// currently active child route (e.g. "/profile/accounts").
	const tabLinks = pages.map((p) => p.link).filter((l) => !!l) as string[];

	const getTabBasePath = () => {
		const pathname = location.pathname;
		const indices = tabLinks.map((link) => pathname.indexOf(`/${link}`)).filter((i) => i >= 0);

		if (indices.length === 0) {
			return pathname;
		}

		const firstIndex = Math.min(...indices);
		return pathname.slice(0, firstIndex);
	};

	const tabBasePath = getTabBasePath();

	// Convert absolute pathname to relative pathname for matchRoutes
	// matchRoutes expects a pathname relative to the tab base path
	const relativePathname = location.pathname.startsWith(tabBasePath) ? location.pathname.slice(tabBasePath.length) : location.pathname;

	const matchedPages = matchRoutes(convertedRoutes, { pathname: relativePathname } as Location);
	const matchedIds = matchedPages ? matchedPages.map((match) => match.route.id?.toString() || '') : [];
	const toTabHref = (link: string) => {
		const normalizedBase = tabBasePath.endsWith('/') ? tabBasePath.slice(0, -1) : tabBasePath;
		return link ? `${normalizedBase}/${link}` : normalizedBase;
	};

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
							<Link to={toTabHref(page.link)}>{page.title}</Link>
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
