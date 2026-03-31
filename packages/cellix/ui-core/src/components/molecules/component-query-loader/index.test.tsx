import { render, screen } from '@testing-library/react';
import { message } from 'antd';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { ComponentQueryLoader } from './index.tsx';

describe('ComponentQueryLoader', () => {
  beforeEach(() => {
    vi.spyOn(message, 'error').mockImplementation(() => undefined as never);
  });

  it('renders the data component when data is available', () => {
    render(
      <ComponentQueryLoader
        error={undefined}
        loading={false}
        hasData={{ ok: true }}
        hasDataComponent={<div>Loaded data</div>}
      />,
    );

    expect(screen.getByText('Loaded data')).toBeInTheDocument();
  });

  it('renders the custom loading component when loading', () => {
    render(
      <ComponentQueryLoader
        error={undefined}
        loading
        hasData={undefined}
        hasDataComponent={<div>Loaded data</div>}
        loadingComponent={<div>Loading state</div>}
      />,
    );

    expect(screen.getByText('Loading state')).toBeInTheDocument();
  });

  it('renders the custom error component when an error exists', () => {
    render(
      <ComponentQueryLoader
        error={new Error('Boom')}
        loading={false}
        hasData={undefined}
        hasDataComponent={<div>Loaded data</div>}
        errorComponent={<div>Error state</div>}
      />,
    );

    expect(screen.getByText('Error state')).toBeInTheDocument();
  });

  it('falls back to the no-data component when no data is returned', () => {
    render(
      <ComponentQueryLoader
        error={undefined}
        loading={false}
        hasData={undefined}
        hasDataComponent={<div>Loaded data</div>}
        noDataComponent={<div>No data state</div>}
      />,
    );

    expect(screen.getByText('No data state')).toBeInTheDocument();
  });
});
