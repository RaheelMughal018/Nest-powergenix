import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PaymentResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'PAY-2026-0001' })
  payment_number: string;

  @ApiProperty({ example: 1 })
  supplier_id: number;

  @ApiPropertyOptional({ example: 'Ahmad Traders' })
  supplier_name?: string;

  @ApiProperty({ example: 1 })
  account_id: number;

  @ApiPropertyOptional({ example: 'Bank Account' })
  account_name?: string;

  @ApiProperty({ example: 1 })
  admin_id: number;

  @ApiPropertyOptional({ example: 'John Doe' })
  admin_name?: string;

  @ApiProperty({ example: '5000.00', description: 'Payment amount' })
  amount: string;

  @ApiProperty({ example: '2026-02-16T10:30:00.000Z' })
  payment_date: Date;

  @ApiPropertyOptional({ example: 1, description: 'Linked invoice ID (if any)' })
  purchase_invoice_id?: number;

  @ApiPropertyOptional({ example: 'PI-2026-0001' })
  invoice_number?: string;

  @ApiPropertyOptional({ example: 'Direct payment' })
  notes?: string;

  @ApiProperty({ example: '2026-02-16T10:30:00.000Z' })
  created_at: Date;

  @ApiProperty({ example: '2026-02-16T10:30:00.000Z' })
  updated_at: Date;
}
