import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentStatus } from '@prisma/client';

export class SupplierStatementInvoiceDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'PI-2026-0001' })
  invoice_number: string;

  @ApiProperty({ example: '2026-02-16T10:30:00.000Z' })
  invoice_date: Date;

  @ApiPropertyOptional({ example: '2026-03-16T10:30:00.000Z' })
  due_date?: Date;

  @ApiProperty({ example: '10050.00', description: 'Total amount' })
  total_amount: string;

  @ApiProperty({ example: '5000.00', description: 'Paid amount' })
  paid_amount: string;

  @ApiProperty({ example: '5050.00', description: 'Outstanding amount' })
  outstanding_amount: string;

  @ApiProperty({ enum: PaymentStatus, example: PaymentStatus.PARTIAL })
  payment_status: PaymentStatus;

  @ApiPropertyOptional({ example: 'Additional notes' })
  notes?: string;
}

export class SupplierStatementPaymentDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'PAY-2026-0001' })
  payment_number: string;

  @ApiProperty({ example: '2026-02-16T10:30:00.000Z' })
  payment_date: Date;

  @ApiProperty({ example: '5000.00', description: 'Payment amount' })
  amount: string;

  @ApiPropertyOptional({ example: 'PI-2026-0001' })
  invoice_number?: string;

  @ApiPropertyOptional({ example: 1 })
  invoice_id?: number;

  @ApiProperty({ example: 'Bank Account' })
  account_name: string;

  @ApiPropertyOptional({ example: 'Payment for Invoice #PI-2026-0001' })
  notes?: string;
}

export class SupplierStatementSummaryDto {
  @ApiProperty({ example: '50000.00', description: 'Total purchase amount' })
  total_purchases: string;

  @ApiProperty({ example: '30000.00', description: 'Total payments made' })
  total_payments: string;

  @ApiProperty({ example: '20000.00', description: 'Outstanding balance' })
  outstanding_balance: string;

  @ApiProperty({ example: 10, description: 'Number of invoices' })
  invoice_count: number;

  @ApiProperty({ example: 15, description: 'Number of payments' })
  payment_count: number;

  @ApiProperty({ example: 5, description: 'Number of unpaid invoices' })
  unpaid_invoice_count: number;

  @ApiProperty({ example: 3, description: 'Number of partial invoices' })
  partial_invoice_count: number;
}

export class SupplierStatementDto {
  @ApiProperty({ example: 1 })
  supplier_id: number;

  @ApiProperty({ example: 'Ahmad Traders' })
  supplier_name: string;

  @ApiPropertyOptional({ example: 'Ahmad Traders Ltd' })
  company_name?: string;

  @ApiPropertyOptional({ example: '03333333333' })
  phone?: string;

  @ApiPropertyOptional({ example: '123 Main St' })
  address?: string;

  @ApiProperty({ example: '5000.00', description: 'Opening balance' })
  opening_balance: string;

  @ApiProperty({ example: '20000.00', description: 'Current balance' })
  current_balance: string;

  @ApiProperty({ type: SupplierStatementSummaryDto })
  summary: SupplierStatementSummaryDto;

  @ApiProperty({ type: [SupplierStatementInvoiceDto] })
  invoices: SupplierStatementInvoiceDto[];

  @ApiProperty({ type: [SupplierStatementPaymentDto] })
  payments: SupplierStatementPaymentDto[];
}
