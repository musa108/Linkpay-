export type InvoiceStatus = 'PENDING' | 'PAID' | 'FAILED';
export interface Invoice {
  id: string;
  title: string;
  description?: string;
  customerName: string;
  customerEmail?: string;
  amount: string;
  currency: 'USDC';
  recipientAddress: string;
  status: InvoiceStatus;
  transactionHash?: string;
  confirmedAt?: string;
  attemptState?: 'AWAITING_APPROVAL';
  createdAt: string;
}
