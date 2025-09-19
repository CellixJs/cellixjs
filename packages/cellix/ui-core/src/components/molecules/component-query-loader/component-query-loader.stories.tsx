import type { Meta, StoryObj } from '@storybook/react';
import { expect, within } from 'storybook/test';
import { ComponentQueryLoader } from './index.js';

const meta = {
  title: 'UI/Core/Molecules/ComponentQueryLoader',
  component: ComponentQueryLoader,
  parameters: { layout: 'padded' }
} satisfies Meta<typeof ComponentQueryLoader>;

export default meta;
type Story = StoryObj<typeof ComponentQueryLoader>;

export const HasDataState: Story = {
  args: {
    error: undefined,
    loading: false,
    hasData: { ok: true },
    hasDataComponent: <div>Loaded data</div>
  },
  // Assert the hasDataComponent is rendered
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.findByText('Loaded data')).resolves.toBeTruthy();
  }
};

export const LoadingStateWithoutLoadingComponent: Story = {
  args: {
    loading: true,
    hasData: undefined,
    hasDataComponent: <div>Loaded data</div>
  },
  // Assert the hasDataComponent never renders and an Ant Design Skeleton component is rendered
  play: ({ canvasElement }) => {
    const canvas = within(canvasElement);
    expect(canvas.queryByText('Loaded data')).toBeNull();
    expect((canvasElement).getElementsByClassName('ant-skeleton').length).toBeGreaterThan(0);
  }
};

export const LoadingStateWithLoadingComponent: Story = {
  args: {
    loading: true,
    hasData: undefined,
    hasDataComponent: <div>Loaded data</div>,
    loadingComponent: <div>Loading...</div>
  },
  // Assert the hasDataComponent never renders and the loadingComponent is rendered
  play: ({ canvasElement }) => {
    const canvas = within(canvasElement);
    expect(canvas.queryByText('Loaded data')).toBeNull();
    expect(canvas.queryByText('Loading...')).toBeTruthy();
  }
};

export const ErrorStateWithoutErrorComponent: Story = {
  args: {
    loading: false,
    error: new Error('Boom'),
    hasData: undefined,
    hasDataComponent: <div>Loaded</div>
  },
  // AntD message.error renders outside of the canvas via a portal; asserting it is flaky.
  // Here we assert the in-canvas fallback (Skeleton) instead.
  play: ({ canvasElement }) => {
    const canvas = within(canvasElement);
    expect(canvas.queryByText(/loaded/i)).toBeNull();
    expect((canvasElement).getElementsByClassName('ant-skeleton').length).toBeGreaterThan(0);
  }
};

export const ErrorStateWithErrorComponent: Story = {
  args: {
    loading: false,
    error: new Error('Boom'),
    hasData: undefined,
    hasDataComponent: <div>Loaded</div>,
    errorComponent: <div>Error occurred</div>
  },
  // Assert the errorComponent is rendered
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.findByText('Error occurred')).resolves.toBeTruthy();
  }
};

export const NoDataStateWithoutNoDataComponent: Story = {
    args: {
        loading: false,
        hasData: undefined,
        hasDataComponent: <div>Loaded</div>
    },
    // Assert the fallback noDataComponent is rendered (Ant Design skeleton)
    play: ({ canvasElement }) => {
        const canvas = within(canvasElement);
        expect(canvas.queryByText('Loaded data')).toBeNull();
        expect((canvasElement).getElementsByClassName('ant-skeleton').length).toBeGreaterThan(0);
    }
}

export const NoDataStateWithNoDataComponent: Story = {
  args: {
    loading: false,
    hasData: undefined,
    hasDataComponent: <div>Loaded</div>,
    noDataComponent: <div>No Data</div>
  },
  // Assert the noDataComponent is rendered
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.findByText('No Data')).resolves.toBeTruthy();
  }
};