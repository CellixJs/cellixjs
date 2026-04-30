import type React from 'react';
import { useParams } from 'react-router-dom';
import { MembersDetailContainer } from '../components/members-detail.container.tsx';

interface MembersGeneralParams {
	id?: string;
	communityId?: string;
	[key: string]: string | undefined;
}

export const MembersGeneral: React.FC = () => {
	const params = useParams<MembersGeneralParams>();

	return <MembersDetailContainer data={{ id: params.id ?? '' }} />;
};
