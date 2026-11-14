export type InvoiceStatus = 'PENDING' | 'PAID' | 'FAILED';
export interface Invoice {
  id: string;
  title: string;
  customerName: string;
  amount: string;
  currency: 'USDC';
  recipientAddress: string;
  status: InvoiceStatus;
  transactionHash?: string;
  createdAt: string;
}
