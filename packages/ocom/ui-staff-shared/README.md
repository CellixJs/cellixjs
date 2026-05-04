# UI Staff Shared

Shared UI components and patterns for the Staff Portal, providing a consistent layout structure and navigation interface across all staff administrative routes.

## Overview

This package provides:
- **SectionLayout**: A reusable full-page layout component for staff portal sections
- **StaffRouteShell**: A wrapper component for backward compatibility
- **StaffAuthContext & StaffAuthProvider**: Authentication context for staff user data
- Re-exports of **MenuComponent**, **PageLayoutProps**, and **MenuComponentProps** from `@ocom/ui-shared`

## SectionLayout Pattern

The `SectionLayout` component implements an Ant Design-based layout with:
- Collapsible sidebar with localStorage persistence
- Top header area for navigation and user info
- Integrated navigation menu via `MenuComponent`
- Responsive design

### Usage

```tsx
import { SectionLayout, type SectionLayoutProps } from '@ocom/ui-staff-shared';
import { DashboardOutlined } from '@ant-design/icons';

export const MyStaffRoute: React.FC = () => {
	const pageLayouts: SectionLayoutProps['pageLayouts'] = [
		{
			path: '/staff/my-section',
			title: 'My Section',
			icon: <DashboardOutlined />,
			id: 'my-section',
		},
	];

	return (
		<SectionLayout
			title="My Section"
			description="Description of this section"
			pageLayouts={pageLayouts}
		/>
	);
};
```

### Props

```typescript
interface SectionLayoutProps {
	pageLayouts: PageLayoutProps[];      // Menu items configuration
	memberData?: unknown;                 // User data for permission checks
	title?: string;                       // Header title (default: "Staff Portal")
	description?: string;                 // Header subtitle (default: "Staff administrative dashboard")
}
```

## MenuComponent Integration

The `MenuComponent` from `@ocom/ui-shared` is integrated into the sidebar. Configure menu items using `PageLayoutProps`:

```typescript
interface PageLayoutProps {
	path: string;                         // Route path
	title: string;                        // Menu label
	icon: React.JSX.Element;              // Icon component
	id: string | number;                  // Unique identifier
	parent?: string;                      // Parent menu ID for nesting (optional)
	hasPermissions?: (member: unknown) => boolean;  // Permission check (optional)
}
```

## Sidebar Collapse State

The sidebar collapse state is persisted in localStorage using the key `StaffSidebarCollapsed`. This allows users' sidebar preferences to persist across sessions.

## StaffAuthContext

Provides access to authenticated staff user information:

```typescript
type StaffAuth = {
	name?: string;
	username?: string;
	email?: string;
	roles?: string[];
	raw?: Record<string, unknown>;
	onLogout?: () => Promise<void> | void;
};
```

Usage:

```tsx
import { StaffAuthContext } from '@ocom/ui-staff-shared';
import { useContext } from 'react';

export const MyComponent = () => {
	const auth = useContext(StaffAuthContext);
	return <div>{auth?.name}</div>;
};
```

## Styling

The component uses:
- Ant Design theme tokens for color consistency
- CSS classes defined in `section-layout.css`
- Responsive height calculations (100vh - header height)

### CSS Classes

- `.logo`: Sidebar logo area
- `.site-layout`: Main layout container
- `.site-layout-background`: Sidebar background
- `.allowBoxShadow`: Utility class for shadow styling

## Dependencies

- `react@^19.1.1`
- `react-dom@^19.1.1`
- `react-router-dom`: For route integration
- `antd`: Ant Design components and theming
- `@ant-design/icons`: Icon components
- `@ocom/ui-shared`: Shared UI components (MenuComponent, etc.)

## Architecture

The SectionLayout follows the Community Portal's admin route pattern, providing:
- Consistent user experience across staff portal
- Reusable sidebar navigation
- Proper separation of layout from route-specific content
- localStorage persistence for UX improvement

## Migration from StaffRouteShell

While `StaffRouteShell` is still available for backward compatibility, new staff route packages should use `SectionLayout` directly:

**Old approach:**
```tsx
import { StaffRouteShell } from '@ocom/ui-staff-shared';

export const SectionLayout = () => (
	<StaffRouteShell title="..." description="..." />
);
```

**New approach:**
```tsx
import { SectionLayout } from '@ocom/ui-staff-shared';

export const SectionLayout = () => (
	<SectionLayout
		title="..."
		description="..."
		pageLayouts={[...]}
	/>
);
```

## Testing

Each staff route using this layout should test:
- Layout renders without errors
- MenuComponent receives correct props
- Sidebar collapse functionality works
- Header and content areas are properly positioned
- Auth context integration works when available

## Related Documentation

- [UI Layouts Instructions](./.github/instructions/ui/layouts.instructions.md)
- [Ant Design Documentation](https://ant.design/docs/react/introduce)
- [React Router Documentation](https://reactrouter.com/)
