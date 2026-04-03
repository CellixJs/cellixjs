import { message, Skeleton } from 'antd';
import type { FC } from 'react';

/**
 * Props for {@link ComponentQueryLoader}.
 */
export interface ComponentQueryLoaderProps {
	/**
	 * Error object for the current request state.
	 *
	 * @remarks
	 * When this value is defined, the error branch takes precedence over loading, data,
	 * and empty-state rendering.
	 */
	error: Error | undefined;
	/**
	 * Custom element to render instead of the default skeleton-based error fallback.
	 */
	errorComponent?: React.JSX.Element;
	/**
	 * Whether the backing request is still in progress.
	 */
	loading: boolean;
	/**
	 * Truthy signal that data is available for the success branch.
	 *
	 * @remarks
	 * The component treats this value as an existence check only; it does not inspect or
	 * render the object directly.
	 */
	hasData: object | null | undefined;
	/**
	 * Element to render when {@link ComponentQueryLoaderProps.hasData} is truthy.
	 */
	hasDataComponent: React.JSX.Element;
	/**
	 * Element to render when no data is available and the request is neither loading nor failed.
	 *
	 * @defaultValue A fallback Ant Design skeleton
	 */
	noDataComponent?: React.JSX.Element;
	/**
	 * Number of rows to show in the default loading skeleton.
	 *
	 * @defaultValue 3
	 */
	loadingRows?: number;
	/**
	 * Custom element to render instead of the default loading skeleton.
	 */
	loadingComponent?: React.JSX.Element;
}

/**
 * Renders loading, error, success, and empty states for a query-backed UI fragment.
 *
 * @param props - The state inputs and UI elements used to select the rendered branch.
 * @returns The element that matches the current observable query state.
 *
 * @remarks
 * Branch precedence is `error -> loading -> success -> empty`.
 *
 * When no custom error component is provided, the component reports the error through
 * Ant Design's global `message` API and falls back to a skeleton placeholder. When no
 * custom loading or empty-state components are provided, it falls back to Ant Design
 * skeletons for those branches as well.
 *
 * @example
 * ```tsx
 * import { useQuery } from "@apollo/client";
 * import { ComponentQueryLoader } from "@cellix/ui-core";
 *
 * function ProfilePanel() {
 *   const { data, error, loading } = useQuery(GET_PROFILE_QUERY);
 *
 *   return (
 *     <ComponentQueryLoader
 *       error={error}
 *       hasData={data?.profile}
 *       hasDataComponent={<ProfileCard profile={data.profile} />}
 *       loading={loading}
 *       noDataComponent={<Empty description="No profile found" />}
 *     />
 *   );
 * }
 * ```
 */
export const ComponentQueryLoader: FC<ComponentQueryLoaderProps> = (props) => {
	if (props.error) {
		if (props.errorComponent) {
			return props.errorComponent;
		}
		message.error(props.error.message);
		return <Skeleton />;
	}
	if (props.loading) {
		if (props.loadingComponent) {
			return props.loadingComponent;
		}
		return (
			<Skeleton
				active
				paragraph={{ rows: props.loadingRows ?? 3 }}
				title={false}
			/>
		);
	}
	if (props.hasData) {
		return props.hasDataComponent;
	}
	return props.noDataComponent ?? <Skeleton loading />;
};
