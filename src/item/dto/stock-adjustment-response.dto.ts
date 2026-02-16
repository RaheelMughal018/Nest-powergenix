import { ApiProperty } from '@nestjs/swagger';
import { Decimal } from '@prisma/client/runtime/library';

export class StockAdjustmentResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 1 })
  item_id: number;

  @ApiProperty({ example: 1 })
  admin_id: number;

  @ApiProperty({ example: 'John Doe', description: 'Admin name who made the adjustment' })
  admin_name?: string;

  @ApiProperty({ example: '50.500', description: 'Quantity adjusted (positive = added, negative = removed)' })
  quantity: Decimal;

  @ApiProperty({ example: '250.00', description: 'Average price at the time of adjustment' })
  avg_price: Decimal;

  @ApiProperty({ example: 'Opening Stock' })
  reason: string;

  @ApiProperty({ example: 'Received from warehouse A' })
  notes?: string;

  @ApiProperty({ example: '2026-02-15T10:30:00.000Z' })
  adjustment_date: Date;

  @ApiProperty({ example: '2026-02-15T10:30:00.000Z' })
  created_at: Date;
}
