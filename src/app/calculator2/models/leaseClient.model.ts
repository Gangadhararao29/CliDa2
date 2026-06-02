export interface LeaseTransaction {
  amountPerAcre: number;
  interest: number;
  startDate: string | Date;
}

export interface ClosedTransaction {
  amountPerAcre: number;
  interestRate: number;
  startDate: string | Date;
  endDate: string | Date;
  timePeriod: { d: number; m: number; y: number; tm: number };
  tm?: number;
  principal: number;
  interest: number;
  totalAmount: number;
  year: number;
  acres: number;
}

export interface CalculationResult {
  year: number;
  principal: number;
  amountPerAcre: number;
  interestRate: number;
  startDate: string | Date;
  endDate: string | Date;
  timePeriod: { d: number; m: number; y: number; tm: number };
  interest: number;
  totalAmount: number;
}

export interface LeaseClient {
  id: number;
  acres: number;
  lastPaidYear: number;
  name: string;
  endDate: Date | string;
  transactions: Array<LeaseTransaction>;
  closedTrans: Array<ClosedTransaction>;
  notes: string;
}
