import { createRoot } from 'react-dom/client';
import type { PageLayoutProps } from '@ocom/ui-shared';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SectionLayoutContainer } from './section-layout.container.tsx';

const useQueryMock = vi.fn();
let lastLoaderProps: Record<string, unknown> | undefined;
let lastSectionProps: Record<string, unknown> | undefined;

vi.mock('@apollo/client', () => ({
	useQuery: (...args: unknown[]) => useQueryMock(...args),
}));

vi.mock('@cellix/ui-core', () => ({
	ComponentQueryLoader: (props: Record<string, unknown>) => {
		lastLoaderProps = props;
		// Render the hasDataComponent if provided
		return props.hasDataComponent as unknown;
	},
}));

vi.mock('./generated.tsx', () => ({
	SectionLayoutHeaderCurrentStaffUserDocument: 'SectionLayoutHeaderCurrentStaffUserDocument',
}));

vi.mock('./section-layout.tsx', () => ({
	SectionLayout: (props: Record<string, unknown>) => {
		lastSectionProps = props;
		const displayName = (props.displayName as string | undefined) ?? 'no-name';
		return <div data-testid="section">{displayName}</div>;
	},
}));

const pageLayouts: PageLayoutProps[] = [
	{
		path: '/staff/custom',
		title: 'Custom',
		icon: <span />,
		id: 'ROOT',
	},
];

describe('SectionLayoutContainer', () => {
	let container: HTMLDivElement;

	beforeEach(() => {
		useQueryMock.mockReset();
		lastLoaderProps = undefined;
		lastSectionProps = undefined;
		container = document.createElement('div');
		document.body.appendChild(container);
	});

	afterEach(() => {
		if (container && document.body.contains(container)) {
			document.body.removeChild(container);
		}
	});

	it('passes displayName to SectionLayout when present', async () => {
		useQueryMock.mockReturnValue({
			loading: false,
			error: undefined,
			data: {
				currentStaffUserAndCreateIfNotExists: {
					displayName: 'Jess',
				},
			},
		});

		const root = createRoot(container);
		root.render(<SectionLayoutContainer pageLayouts={pageLayouts} />);

		// Give React time to render
		await new Promise((resolve) => setTimeout(resolve, 10));

		expect(lastSectionProps?.displayName).toBe('Jess');
		expect(lastLoaderProps?.loading).toBe(false);
		expect(lastLoaderProps?.error).toBeUndefined();
		expect(lastLoaderProps?.hasData).toBeTruthy();
		expect(container.querySelector('[data-testid="section"]')?.textContent).toContain('Jess');
	});

	it('omits displayName when the query returns none', async () => {
		useQueryMock.mockReturnValue({
			loading: false,
			error: undefined,
			data: {
				currentStaffUserAndCreateIfNotExists: {},
			},
		});

		const root = createRoot(container);
		root.render(<SectionLayoutContainer pageLayouts={pageLayouts} />);

		await new Promise((resolve) => setTimeout(resolve, 10));

		expect(lastSectionProps?.displayName).toBeUndefined();
		expect('displayName' in (lastSectionProps ?? {})).toBe(false);
	});

	it('marks hasData as false when the query has no data', async () => {
		useQueryMock.mockReturnValue({
			loading: false,
			error: undefined,
			data: undefined,
		});

		const root = createRoot(container);
		root.render(<SectionLayoutContainer pageLayouts={pageLayouts} />);

		await new Promise((resolve) => setTimeout(resolve, 10));

		expect(lastLoaderProps?.hasData).toBeFalsy();
	});
});
