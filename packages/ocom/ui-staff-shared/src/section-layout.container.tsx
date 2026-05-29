import { useQuery } from '@apollo/client';
import { ComponentQueryLoader } from '@cellix/ui-core';
import type { PageLayoutProps } from '@ocom/ui-shared';
import type React from 'react';
import { SectionLayoutHeaderCurrentStaffUserDocument } from './generated.tsx';
import { SectionLayout } from './section-layout.tsx';

interface SectionLayoutContainerProps {
	pageLayouts: PageLayoutProps[];
}

export const SectionLayoutContainer: React.FC<SectionLayoutContainerProps> = (props) => {
	const { data: staffUserData, loading: staffUserLoading, error: staffUserError } = useQuery(
		SectionLayoutHeaderCurrentStaffUserDocument,
		{
			fetchPolicy: 'cache-first',
		},
	);

	const displayName = staffUserData?.currentStaffUserAndCreateIfNotExists?.displayName;

	// Debug logging to track displayName flow
	if (typeof window !== 'undefined' && typeof window.location !== 'undefined') {
		const href = window.location.href;
		if (href.includes('dev') || href.includes('localhost')) {
			console.debug('[SectionLayoutContainer] GraphQL query result:', {
				loading: staffUserLoading,
				error: staffUserError?.message,
				staffUserData,
				extractedDisplayName: displayName,
			});
		}
	}

	const sectionLayoutProps: React.ComponentProps<typeof SectionLayout> = {
		pageLayouts: props.pageLayouts,
		// Always pass displayName (even if undefined) so the component can properly handle fallback chain
		...(displayName && { displayName }),
	};

	return (
		<ComponentQueryLoader
			loading={staffUserLoading}
			hasData={staffUserData?.currentStaffUserAndCreateIfNotExists}
			hasDataComponent={<SectionLayout {...sectionLayoutProps} />}
			error={staffUserError}
		/>
	);
};

