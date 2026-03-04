import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentStatus } from '@prisma/client';

export class CustomerStatementInvoiceDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'SINV-2026-0001' })
  invoice_number: string;

  @ApiProperty({ example: '2026-02-16T10:30:00.000Z' })
  invoice_date: Date;

  @ApiPropertyOptional({ example: '2026-03-16T10:30:00.000Z' })
  due_date?: Date;

  @ApiProperty({ example: '10050.00', description: 'Total amount' })
  total_amount: string;

  @ApiProperty({ example: '5000.00', description: 'Received amount' })
  received_amount: string;

  @ApiProperty({ example: '5050.00', description: 'Outstanding amount' })
  outstanding_amount: string;

  @ApiProperty({ enum: PaymentStatus, example: PaymentStatus.PARTIAL })
  payment_status: PaymentStatus;

  @ApiPropertyOptional({ example: 'Additional notes' })
  notes?: string;
}

export class CustomerStatementReceiptDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'REC-2026-0001' })
  receipt_number: string;

  @ApiProperty({ example: '2026-02-16T10:30:00.000Z' })
  receipt_date: Date;

  @ApiProperty({ example: '5000.00', description: 'Receipt amount' })
  amount: string;

  @ApiPropertyOptional({ example: 'SINV-2026-0001' })
  invoice_number?: string;

  @ApiPropertyOptional({ example: 1 })
  invoice_id?: number;

  @ApiProperty({ example: 'Bank Account' })
  account_name: string;

  @ApiPropertyOptional({ example: 'Payment for Sale Invoice #SINV-2026-0001' })
  notes?: string;
}

export class CustomerStatementSummaryDto {
  @ApiProperty({ example: '50000.00', description: 'Total sales amount' })
  total_sales: string;

  @ApiProperty({ example: '30000.00', description: 'Total receipts received' })
  total_receipts: string;

  @ApiProperty({ example: '20000.00', description: 'Outstanding balance (customer owes)' })
  outstanding_balance: string;

  @ApiProperty({ example: 10, description: 'Number of sale invoices' })
  invoice_count: number;

  @ApiProperty({ example: 15, description: 'Number of receipts' })
  receipt_count: number;

  @ApiProperty({ example: 5, description: 'Number of unpaid invoices' })
  unpaid_invoice_count: number;

  @ApiProperty({ example: 3, description: 'Number of partial invoices' })
  partial_invoice_count: number;
}

export class CustomerStatementDto {
  @ApiProperty({ example: 1 })
  customer_id: number;

  @ApiProperty({ example: 'ABC Company' })
  customer_name: string;

  @ApiPropertyOptional({ example: 'ABC Company Ltd' })
  company_name?: string;

  @ApiPropertyOptional({ example: '03333333333' })
  phone?: string;

  @ApiPropertyOptional({ example: '123 Main St' })
  address?: string;

  @ApiProperty({ example: '5000.00', description: 'Opening balance' })
  opening_balance: string;

  @ApiProperty({ example: '20000.00', description: 'Current balance (amount customer owes)' })
  current_balance: string;

  @ApiProperty({ type: CustomerStatementSummaryDto })
  summary: CustomerStatementSummaryDto;

  @ApiProperty({ type: [CustomerStatementInvoiceDto] })
  invoices: CustomerStatementInvoiceDto[];

  @ApiProperty({ type: [CustomerStatementReceiptDto] })
  receipts: CustomerStatementReceiptDto[];
}
