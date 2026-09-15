import { useMutation, useQuery } from '@apollo/client';
import { ComponentQueryLoader } from '@cellix/ui-core';
import { PRICE_PER_MEMBER_IN_CENTS, toPaymentInstrumentInput, toSubscriptionTier } from '@ocom/ui-community-shared';
import { App } from 'antd';
import { useParams } from 'react-router-dom';
import {
	AdminCommunityBillingContainerCommunityByIdDocument,
	AdminCommunityBillingContainerCommunityProcessSubscriptionChargeDocument,
	AdminCommunityBillingContainerCommunitySubscriptionDocument,
	AdminCommunityBillingContainerCommunityUpdatePaymentInstrumentDocument,
	AdminCommunityBillingContainerCommunityUpdateSubscriptionTierDocument,
} from '../generated.tsx';
import { CommunityBilling, type CommunityBillingProps, type CommunityBillingSaveValues, type CommunityBillingTransaction } from './community-billing.tsx';

const DEFAULT_CURRENCY = 'USD';

export const CommunityBillingContainer: React.FC = () => {
	const params = useParams();
	// biome-ignore lint:useLiteralKeys
	const communityId = params['communityId'] ?? '';
	const { message } = App.useApp();

	const {
		data: communityData,
		loading: communityLoading,
		error: communityError,
		refetch: refetchCommunity,
	} = useQuery(AdminCommunityBillingContainerCommunityByIdDocument, {
		variables: { id: communityId },
		skip: !communityId,
	});

	const {
		data: subscriptionData,
		loading: subscriptionLoading,
		refetch: refetchSubscription,
	} = useQuery(AdminCommunityBillingContainerCommunitySubscriptionDocument, {
		variables: { communityId },
		skip: !communityId,
	});

	const [updateSubscriptionTier, { loading: tierSaving }] = useMutation(AdminCommunityBillingContainerCommunityUpdateSubscriptionTierDocument);
	const [updatePaymentInstrument, { loading: instrumentSaving }] = useMutation(AdminCommunityBillingContainerCommunityUpdatePaymentInstrumentDocument);
	const [processSubscriptionCharge, { loading: charging }] = useMutation(AdminCommunityBillingContainerCommunityProcessSubscriptionChargeDocument);

	const community = communityData?.communityById;
	const subscription = subscriptionData?.communitySubscription;
	const tier = toSubscriptionTier(subscription?.tier ?? community?.finance?.subscriptionTier);

	const transactions: CommunityBillingTransaction[] = (community?.finance?.transactions ?? []).map((transaction, index) => ({
		id: String(transaction?.id ?? index),
		amount: transaction?.amount ?? 0,
		isSuccess: transaction?.transactionReference?.isSuccess === true,
	}));

	const refresh = async (): Promise<void> => {
		await Promise.all([refetchCommunity(), refetchSubscription()]);
	};

	const handleSave = async (values: CommunityBillingSaveValues): Promise<void> => {
		if (values.subscriptionTier) {
			const result = await updateSubscriptionTier({
				variables: { input: { communityId, subscriptionTier: values.subscriptionTier } },
			});
			const status = result.data?.communityUpdateSubscriptionTier?.status;
			if (status?.success !== true) {
				throw new Error(status?.errorMessage ?? 'Unable to update the subscription plan.');
			}
		}
		if (values.paymentInstrument) {
			const result = await updatePaymentInstrument({
				variables: { input: { communityId, paymentInstrument: toPaymentInstrumentInput(values.paymentInstrument) } },
			});
			const status = result.data?.communityUpdatePaymentInstrument?.status;
			if (status?.success !== true) {
				throw new Error(status?.errorMessage ?? 'Unable to update the payment instrument.');
			}
		}
		await refresh();
		message.success('Billing settings saved');
	};

	const handleProcessCharge = async (): Promise<void> => {
		const result = await processSubscriptionCharge({ variables: { input: { communityId } } });
		const status = result.data?.communityProcessSubscriptionCharge?.status;
		if (status?.success !== true) {
			throw new Error(status?.errorMessage ?? 'Unable to process the subscription charge.');
		}
		await refresh();
	};

	const billingProps: CommunityBillingProps = {
		subscriptionTier: tier,
		pricePerMember: subscription?.pricePerMember ?? PRICE_PER_MEMBER_IN_CENTS[tier],
		currency: subscription?.currency ?? DEFAULT_CURRENCY,
		memberCount: subscription?.memberCount ?? 0,
		amount: subscription?.amount ?? 0,
		transactions,
		paymentInstrument: community?.paymentInstrument ?? null,
		saving: tierSaving || instrumentSaving,
		charging,
		onSave: handleSave,
		onProcessCharge: handleProcessCharge,
	};

	return (
		<ComponentQueryLoader
			loading={communityLoading || subscriptionLoading}
			hasData={community}
			hasDataComponent={<CommunityBilling {...billingProps} />}
			error={communityError}
		/>
	);
};
