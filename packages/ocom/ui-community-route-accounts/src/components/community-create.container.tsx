import { useMutation } from '@apollo/client';
import { App } from 'antd';
import { useNavigate } from 'react-router-dom';
import { AccountsCommunityCreateContainerCommunityCreateDocument, AccountsCommunityListContainerCommunitiesForCurrentEndUserDocument, type CommunityCreateInput } from '../generated.tsx';
import { CommunityCreate } from './community-create.tsx';

export const CommunityCreateContainer: React.FC = () => {
	const { message } = App.useApp();
	const [createCommunity, { loading, error }] = useMutation(AccountsCommunityCreateContainerCommunityCreateDocument, {
		update(cache, { data }) {
			// update the list with the new item
			const newCommunity = data?.communityCreate?.community;
			const communitiesQuery = cache.readQuery<{
				communitiesForCurrentEndUser: NonNullable<typeof newCommunity>[];
			}>({
				query: AccountsCommunityListContainerCommunitiesForCurrentEndUserDocument,
			});
			const communities = communitiesQuery?.communitiesForCurrentEndUser;
			if (newCommunity && communities) {
				cache.writeQuery({
					query: AccountsCommunityListContainerCommunitiesForCurrentEndUserDocument,
					data: {
						communitiesForCurrentEndUser: [...communities, newCommunity],
					},
				});
			}
		},
	});
	const navigate = useNavigate();

	const handleSave = async (values: CommunityCreateInput) => {
		const newCommunity: CommunityCreateInput = {
			...values,
		};
		try {
			const result = await createCommunity({
				variables: {
					input: newCommunity,
				},
			});
			// A rejected payment token, a missing plan configuration or a gateway error all
			// come back as an unsuccessful status rather than a thrown error, so the status
			// has to be checked before reporting success and navigating away.
			const status = result.data?.communityCreate?.status;
			if (status?.success !== true) {
				message.error(status?.errorMessage ?? 'Unable to create the community.');
				return;
			}
			message.success('Community Created');
			navigate('../');
		} catch (saveError) {
			message.error(`Error creating community: ${saveError instanceof Error ? saveError.message : JSON.stringify(saveError)}`);
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
