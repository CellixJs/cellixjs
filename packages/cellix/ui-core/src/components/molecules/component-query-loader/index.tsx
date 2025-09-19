import { message, Skeleton } from 'antd';
import type { FC } from 'react';

export interface ComponentQueryLoaderProps {
    error: Error | undefined;
    errorComponent?: React.JSX.Element;
    loading: boolean;
    hasData: object | null | undefined;
    hasDataComponent: React.JSX.Element;
    noDataComponent?: React.JSX.Element;
    loadingRows?: number;
    loadingComponent?: React.JSX.Element; 
}

export const ComponentQueryLoader: FC<ComponentQueryLoaderProps> = (props) => {
  if (props.error) {
    if (props.errorComponent) {
      return props.errorComponent;
    }
    message.error(props.error.message);
    return <Skeleton/>;
  }
  if (props.loading) {
    if (props.loadingComponent) {
      return props.loadingComponent;
    }
    return <Skeleton active paragraph={{ rows: props.loadingRows ?? 3 }} title= {false}/>;
  }
  if (props.hasData) {
    return props.hasDataComponent;
  }
  return props.noDataComponent ?? <Skeleton loading/>;
};
