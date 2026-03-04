import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Decimal } from '@prisma/client/runtime/library';

export class ReceiptResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty({ example: 'REC-2026-0001' })
  receipt_number: string;

  @ApiProperty()
  customer_id: number;

  @ApiPropertyOptional()
  customer_name?: string;

  @ApiProperty()
  account_id: number;

  @ApiPropertyOptional()
  account_name?: string;

  @ApiProperty()
  admin_id: number;

  @ApiPropertyOptional()
  admin_name?: string;

  @ApiProperty({ description: 'Amount received' })
  amount: Decimal;

  @ApiProperty()
  receipt_date: Date;

  @ApiPropertyOptional({ description: 'Set when receipt is linked to a sale invoice (automatic)' })
  sale_invoice_id?: number | null;

  @ApiPropertyOptional()
  notes?: string | null;

  @ApiProperty()
  created_at: Date;

  @ApiProperty()
  updated_at: Date;
}
