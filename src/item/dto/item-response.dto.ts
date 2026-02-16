import { ApiProperty } from '@nestjs/swagger';
import { ItemType } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

export class ItemResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'Wheat Flour' })
  name: string;

  @ApiProperty({ enum: ItemType, example: ItemType.RAW })
  item_type: ItemType;

  @ApiProperty({ example: 1 })
  category_id: number;

  @ApiProperty({ example: '100.500', description: 'Current quantity' })
  quantity: Decimal;

  @ApiProperty({ example: '250.00', description: 'Average price' })
  avg_price: Decimal;

  @ApiProperty({ example: '2026-02-15T10:30:00.000Z' })
  created_at: Date;

  @ApiProperty({ example: '2026-02-15T10:30:00.000Z' })
  updated_at: Date;
}
