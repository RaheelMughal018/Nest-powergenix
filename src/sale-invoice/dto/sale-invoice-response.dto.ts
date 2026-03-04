import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentStatus } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

export class SaleInvoiceItemResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  item_id: number;

  @ApiPropertyOptional({ description: 'Item name' })
  item_name?: string;

  @ApiPropertyOptional({ description: 'Serial number (FINAL products only)' })
  serial_number?: string;

  @ApiProperty({ description: 'Quantity' })
  quantity: Decimal;

  @ApiProperty({ description: 'Unit price' })
  unit_price: Decimal;

  @ApiProperty({ description: 'Total price' })
  total_price: Decimal;

  @ApiPropertyOptional({ description: 'Production item ID when sold by serial' })
  production_item_id?: number | null;

  @ApiProperty()
  created_at: Date;
}

export class SaleInvoiceResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty({ example: 'SINV-2026-0001' })
  invoice_number: string;

  @ApiProperty()
  customer_id: number;

  @ApiPropertyOptional()
  customer_name?: string;

  @ApiProperty()
  admin_id: number;

  @ApiPropertyOptional()
  admin_name?: string;

  @ApiProperty()
  invoice_date: Date;

  @ApiPropertyOptional()
  due_date?: Date | null;

  @ApiProperty({ description: 'Subtotal before tax/discount' })
  subtotal: Decimal;

  @ApiProperty()
  tax: Decimal;

  @ApiProperty()
  discount: Decimal;

  @ApiProperty({ description: 'Total amount' })
  total_amount: Decimal;

  @ApiProperty({ description: 'Amount received so far' })
  received_amount: Decimal;

  @ApiProperty({ enum: PaymentStatus })
  payment_status: PaymentStatus;

  @ApiPropertyOptional()
  notes?: string | null;

  @ApiProperty()
  created_at: Date;

  @ApiProperty()
  updated_at: Date;

  @ApiPropertyOptional({ type: [SaleInvoiceItemResponseDto] })
  items?: SaleInvoiceItemResponseDto[];

  @ApiPropertyOptional({ description: 'Outstanding amount (total - received)' })
  outstanding_amount?: Decimal;
}
