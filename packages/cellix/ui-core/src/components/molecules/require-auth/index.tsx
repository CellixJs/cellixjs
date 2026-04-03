import { Row, Space, Spin, Typography } from 'antd';
import type React from 'react';
import { useEffect } from 'react';
import { hasAuthParams, useAuth } from 'react-oidc-context';
import { Navigate, useLocation } from 'react-router-dom';

/**
 * Props for {@link RequireAuth}.
 */
export interface RequireAuthProps {
	/**
	 * Protected content to render once the active auth state is authenticated.
	 */
	children: React.JSX.Element;
	/**
	 * Whether the component should preserve the current route and trigger the redirect flow
	 * as soon as it confirms that the user is unauthenticated.
	 *
	 * @defaultValue false
	 */
	forceLogin?: boolean;
}

/**
 * Guards a UI branch behind the active OIDC authentication state.
 *
 * @param props - Protected children and redirect behavior options.
 * @returns Protected content, a blocking loading UI, a redirect element, or no markup while sign-in begins.
 *
 * @remarks
 * Authenticated users receive the protected children, loading states render a blocking
 * spinner, and auth failures redirect back to `/`.
 *
 * Side effects:
 *
 * - When `forceLogin` is `true`, the component stores the current route in
 *   `sessionStorage.redirectTo` before starting the redirect flow.
 * - When the user is unauthenticated, the component triggers `signinRedirect()` and
 *   returns no markup while navigation takes over.
 *
 * @example
 * ```tsx
 * import { RequireAuth } from "@cellix/ui-core";
 *
 * function ProtectedRoute() {
 *   return (
 *     <RequireAuth forceLogin={true}>
 *       <AccountSettings />
 *     </RequireAuth>
 *   );
 * }
 * ```
 */
export const RequireAuth: React.FC<RequireAuthProps> = (props) => {
	const auth = useAuth();
	const location = useLocation();

	// automatically sign-in
	useEffect(() => {
		if (!hasAuthParams() && props.forceLogin === true && !auth.isAuthenticated && !auth.activeNavigator && !auth.isLoading && !auth.error) {
			globalThis.sessionStorage.setItem('redirectTo', `${location.pathname}${location.search}`);

			auth.signinRedirect();
		}
	}, [auth.isAuthenticated, auth.activeNavigator, auth.isLoading, auth.signinRedirect, auth.error, location.pathname, location.search, props.forceLogin]);

	const redirectUser = () => {
		auth.signinRedirect();
	};

	if (auth.isLoading || auth.activeNavigator) {
		//still loading
		return (
			<Row
				justify={'center'}
				style={{ height: '100vh', alignItems: 'center' }}
			>
				<Space
					size={'large'}
					direction="vertical"
					style={{ textAlign: 'center' }}
				>
					<Spin size="large" />
					<Typography.Title level={2}>Please wait...</Typography.Title>
				</Space>
			</Row>
		);
	}
	if (auth.isAuthenticated) {
		return props.children;
	} else if (auth.error) {
		return <Navigate to="/" />;
	} else {
		redirectUser();
		return;
	}
};
