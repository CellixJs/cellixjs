import { useMutation } from '@apollo/client';
import { App } from 'antd';
import { useNavigate } from 'react-router-dom';
import {
	AccountsCommunityCreateContainerCommunityCreateDocument,
	AccountsCommunityListContainerCommunitiesForCurrentEndUserDocument,
	type CommunityCreateInput,
} from '../../../../generated.tsx';
import { CommunityCreate } from './community-create.tsx';

export const CommunityCreateContainer: React.FC = () => {
	const { message } = App.useApp();
	const [createCommunity, { loading, error }] = useMutation(
		AccountsCommunityCreateContainerCommunityCreateDocument,
		{
			update(cache, { data }) {
				// update the list with the new item
				const newCommunity = data?.communityCreate?.community;
				const communities = cache.readQuery({
					query:
						AccountsCommunityListContainerCommunitiesForCurrentEndUserDocument,
				})?.communitiesForCurrentEndUser;
				if (newCommunity && communities) {
					cache.writeQuery({
						query:
							AccountsCommunityListContainerCommunitiesForCurrentEndUserDocument,
						data: {
							communitiesForCurrentEndUser: [...communities, newCommunity],
						},
					});
				}
			},
		},
	);
	const navigate = useNavigate();

	const handleSave = async (values: CommunityCreateInput) => {
		const newCommunity: CommunityCreateInput = {
			...values,
		};
		try {
			await createCommunity({
				variables: {
					input: newCommunity,
				},
			});
			message.success('Community Created');
			navigate('../');
		} catch (saveError) {
			message.error(`Error creating community: ${JSON.stringify(saveError)}`);
		}
	};

	const content = () => {
		if (loading) {
			return <div>Loading...</div>;
		} else if (error) {
			return <div>Error {JSON.stringify(error)}</div>;
		} else {
			return <CommunityCreate onSave={handleSave} />;
		}
	};

	return <>{content()}</>;
};
