import { PaymentStatus, Prisma } from '@prisma/client';

/** Transaction client type for use in provider methods (from Prisma $transaction callback). */
export type SaleInvoiceTx = Prisma.TransactionClient;

/** Resolved line item after validating stock and resolving FINAL (serial) vs RAW (quantity). */
export interface ResolvedLineItem {
  item_id: number;
  item_name: string;
  quantity: number;
  unit_price: number;
  cost_price: number;
  total_price: number;
  profit: number;
  production_item_id: number | null;
  serial_number: string | null;
}

/** Computed totals and dates for a sale invoice. */
export interface InvoiceTotals {
  subtotal: number;
  tax: number;
  discount: number;
  totalAmount: number;
  receivedAmount: number;
  paymentStatus: PaymentStatus;
  invoiceDate: Date;
  dueDate: Date | null;
}
