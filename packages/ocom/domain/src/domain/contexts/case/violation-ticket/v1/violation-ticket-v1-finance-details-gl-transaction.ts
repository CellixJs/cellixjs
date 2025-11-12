import * as DomainSeedwork from '@cellix/domain-seedwork/domain-seedwork';

export interface ViolationTicketV1FinanceDetailsGlTransactionProps extends DomainSeedwork.ValueObjectProps {
  debitGlAccount: string;
  creditGlAccount: string;
  amount: number;
  recognitionDate: Date;
  completedOn?: Date | undefined;
}

export interface ViolationTicketV1FinanceDetailsGlTransactionEntityReference extends Readonly<
  ViolationTicketV1FinanceDetailsGlTransactionProps
> {}

export class ViolationTicketV1FinanceDetailsGlTransaction extends DomainSeedwork.ValueObject<ViolationTicketV1FinanceDetailsGlTransactionProps>
  implements ViolationTicketV1FinanceDetailsGlTransactionEntityReference
{
  get debitGlAccount(): string {
    return this.props.debitGlAccount;
  }

  set debitGlAccount(value: string) {
    this.props.debitGlAccount = value;
  }

  get creditGlAccount(): string {
    return this.props.creditGlAccount;
  }

  set creditGlAccount(value: string) {
    this.props.creditGlAccount = value;
  }

  get amount(): number {
    return this.props.amount;
  }

  set amount(value: number) {
    this.props.amount = value;
  }

  get recognitionDate(): Date {
    return this.props.recognitionDate;
  }

  set recognitionDate(value: Date) {
    this.props.recognitionDate = value;
  }

  get completedOn(): Date | undefined {
    return this.props.completedOn;
  }

  set completedOn(value: Date | undefined) {
    this.props.completedOn = value;
  }
}