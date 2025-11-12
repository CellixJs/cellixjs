import * as DomainSeedwork from '@cellix/domain-seedwork/domain-seedwork';
import type { ViolationTicketV1FinanceDetailsGlTransactionEntityReference } from './violation-ticket-v1-finance-details-gl-transaction.ts';

export interface ViolationTicketV1FinanceDetailsRevenueRecognitionProps extends DomainSeedwork.ValueObjectProps {
  readonly submission: ViolationTicketV1FinanceDetailsGlTransactionEntityReference;
  readonly recognition: ViolationTicketV1FinanceDetailsGlTransactionEntityReference;
}

export interface ViolationTicketV1FinanceDetailsRevenueRecognitionEntityReference extends Readonly<
  Omit<ViolationTicketV1FinanceDetailsRevenueRecognitionProps, 'submission' | 'recognition'>
> {
  readonly submission: ViolationTicketV1FinanceDetailsGlTransactionEntityReference;
  readonly recognition: ViolationTicketV1FinanceDetailsGlTransactionEntityReference;
}

export class ViolationTicketV1FinanceDetailsRevenueRecognition extends DomainSeedwork.ValueObject<ViolationTicketV1FinanceDetailsRevenueRecognitionProps>
  implements ViolationTicketV1FinanceDetailsRevenueRecognitionEntityReference
{
  get submission(): ViolationTicketV1FinanceDetailsGlTransactionEntityReference {
    return this.props.submission;
  }

  get recognition(): ViolationTicketV1FinanceDetailsGlTransactionEntityReference {
    return this.props.recognition;
  }
}