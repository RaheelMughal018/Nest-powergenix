import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentStatus } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

export class PurchaseInvoiceItemResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 1 })
  item_id: number;

  @ApiPropertyOptional({ example: 'Steel Wheel' })
  item_name?: string;

  @ApiProperty({ example: '10.000', description: 'Quantity' })
  quantity: Decimal;

  @ApiProperty({ example: '500.00', description: 'Unit price' })
  unit_price: Decimal;

  @ApiProperty({ example: '5000.00', description: 'Total price' })
  total_price: Decimal;

  @ApiProperty({ example: '2026-02-16T10:30:00.000Z' })
  created_at: Date;
}

export class PurchaseInvoiceResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'PI-2026-0001' })
  invoice_number: string;

  @ApiProperty({ example: 1 })
  supplier_id: number;

  @ApiPropertyOptional({ example: 'Ahmad Traders' })
  supplier_name?: string;

  @ApiProperty({ example: 1 })
  admin_id: number;

  @ApiPropertyOptional({ example: 'John Doe' })
  admin_name?: string;

  @ApiProperty({ example: '2026-02-16T10:30:00.000Z' })
  invoice_date: Date;

  @ApiPropertyOptional({ example: '2026-03-16T10:30:00.000Z' })
  due_date?: Date;

  @ApiProperty({ example: '10000.00', description: 'Subtotal' })
  subtotal: Decimal;

  @ApiProperty({ example: '100.00', description: 'Tax' })
  tax: Decimal;

  @ApiProperty({ example: '50.00', description: 'Discount' })
  discount: Decimal;

  @ApiProperty({ example: '10050.00', description: 'Total amount' })
  total_amount: Decimal;

  @ApiProperty({ example: '5000.00', description: 'Paid amount' })
  paid_amount: Decimal;

  @ApiProperty({ enum: PaymentStatus, example: PaymentStatus.PARTIAL })
  payment_status: PaymentStatus;

  @ApiPropertyOptional({ example: 'Additional notes' })
  notes?: string;

  @ApiProperty({ example: '2026-02-16T10:30:00.000Z' })
  created_at: Date;

  @ApiProperty({ example: '2026-02-16T10:30:00.000Z' })
  updated_at: Date;

  @ApiPropertyOptional({ type: [PurchaseInvoiceItemResponseDto] })
  items?: PurchaseInvoiceItemResponseDto[];

  @ApiPropertyOptional({ example: '5050.00', description: 'Outstanding amount' })
  outstanding_amount?: Decimal;
}
