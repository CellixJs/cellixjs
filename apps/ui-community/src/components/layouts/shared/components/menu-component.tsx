import { Menu, type MenuTheme } from 'antd';
import type { RouteObject } from 'react-router-dom';
import {
	generatePath,
	Link,
	matchRoutes,
	useLocation,
	useParams,
} from 'react-router-dom';
import type { Member } from '../../../../generated.tsx';

const { SubMenu } = Menu;

export interface PageLayoutProps {
	path: string;
	title: string;
	icon: React.JSX.Element;
	id: string | number;
	parent?: string;
	hasPermissions?: (member: Member) => boolean;
}

export interface MenuComponentProps {
	pageLayouts: PageLayoutProps[];
	theme: MenuTheme | undefined;
	mode: 'vertical' | 'horizontal' | 'inline' | undefined;
	memberData?: Member;
}

export const MenuComponent: React.FC<MenuComponentProps> = ({
	pageLayouts,
	memberData,
	...props
}) => {
	const params = useParams();
	const location = useLocation();

    const createPath = (path: string): string => {
        return generatePath(path.replaceAll('*', ''), params);
    };

	const buildMenu = (
		parentId: string | number,
	): React.ReactNode[] | undefined => {
		const children = pageLayouts.filter((x) => x.parent === parentId);
		if (!children || children.length === 0) {
			return;
		}
		return children
			.map((x) => {
				const child = pageLayouts.find((y) => y.id === x.id);
				if (!child) return null;

				const grandChildren = pageLayouts.filter(
					(gc) => gc.parent === child.id,
				);

				if (
					memberData &&
					child.hasPermissions &&
					!child.hasPermissions(memberData)
				) {
					return null;
				}

				return grandChildren && grandChildren.length > 0 ? (
					<SubMenu key={child.id} title={child.title}>
						<Menu.Item key={`${child.id}-link`} icon={child.icon}>
							<Link to={createPath(child.path)}>{child.title}</Link>
						</Menu.Item>
						{buildMenu(child.id)}
					</SubMenu>
				) : (
					<Menu.Item key={child.id} icon={child.icon}>
						<Link to={createPath(child.path)}>{child.title}</Link>
					</Menu.Item>
				);
			})
			.filter(Boolean);
	};

	const topMenu = () => {
		const root = pageLayouts.find((x) => x.id === 'ROOT');
		if (!root) return null;

		const matchedPages = matchRoutes(pageLayouts as RouteObject[], location);
		const matchedIds = matchedPages
			? matchedPages.map((x) => x.route.id?.toString() ?? '')
			: [];

		return (
			<Menu
				theme={props.theme}
				mode={props.mode}
				defaultSelectedKeys={matchedIds}
				selectedKeys={matchedIds}
			>
				<Menu.Item key="ROOT" icon={root.icon}>
					<Link to={createPath(root.path)}>{root.title}</Link>
				</Menu.Item>
				{buildMenu(root.id)}
			</Menu>
		);
	};

	return topMenu();
};
