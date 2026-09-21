import { useMutation, useQuery } from '@apollo/client';
import { ComponentQueryLoader } from '@cellix/ui-core';
import { toPaymentInstrumentInput } from '@ocom/ui-community-shared';
import { App, Card, Typography } from 'antd';
import { useParams } from 'react-router-dom';
import {
	AdminCommunityBillingContainerCommunityByIdDocument,
	AdminCommunityBillingContainerCommunityProcessSubscriptionChargeDocument,
	AdminCommunityBillingContainerCommunitySubscriptionDocument,
	AdminCommunityBillingContainerCommunityUpdatePaymentInstrumentDocument,
	AdminCommunityBillingContainerCommunityUpdateSubscriptionTierDocument,
} from '../generated.tsx';
import { CommunityBilling, type CommunityBillingProps, type CommunityBillingSaveValues, type CommunityBillingTransaction } from './community-billing.tsx';

const { Text, Title } = Typography;

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
		error: subscriptionError,
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
	const tier = subscription?.tier ?? community?.finance?.subscriptionTier ?? '';

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
		const payload = result.data?.communityProcessSubscriptionCharge;
		if (payload?.status?.success !== true) {
			throw new Error(payload?.status?.errorMessage ?? 'Unable to process the subscription charge.');
		}

		// A declined charge is recorded rather than rejected, so the mutation still reports
		// success. Refresh first so the failed charge is visible, then surface the decline.
		const recorded = payload.community?.finance?.transactions ?? [];
		const latest = recorded[recorded.length - 1];
		await refresh();
		if (latest && latest.transactionReference?.isSuccess !== true) {
			throw new Error(latest.transactionReference?.errorMessage ?? 'The payment was declined. The failed charge has been recorded.');
		}
	};

	const billingProps: CommunityBillingProps = {
		subscriptionTier: tier,
		pricePerMember: subscription?.pricePerMember ?? 0,
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

	const loadError = communityError ?? subscriptionError;

	return (
		<ComponentQueryLoader
			loading={communityLoading || subscriptionLoading}
			hasData={community && subscription}
			hasDataComponent={<CommunityBilling {...billingProps} />}
			error={loadError}
			// Without this the loader reports the error through a global toast on every
			// render and leaves an empty skeleton behind, which reads as a screen that
			// never finished loading.
			errorComponent={
				<Card>
					<Title level={5}>Billing is unavailable</Title>
					<Text type="secondary">{loadError?.message ?? 'The billing details for this community could not be loaded.'}</Text>
				</Card>
			}
		/>
	);
};
