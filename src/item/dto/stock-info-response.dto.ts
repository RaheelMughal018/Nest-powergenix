import { ApiProperty } from '@nestjs/swagger';
import { Decimal } from '@prisma/client/runtime/library';

export class StockInfoResponseDto {
  @ApiProperty({ example: 1, description: 'Item ID' })
  item_id: number;

  @ApiProperty({ example: 'Steel Wheel', description: 'Item name' })
  item_name: string;

  @ApiProperty({ example: '100.500', description: 'Current quantity in stock' })
  quantity: Decimal;

  @ApiProperty({ example: '250.00', description: 'Average price per unit' })
  avg_price: Decimal;

  @ApiProperty({ example: '25125.00', description: 'Total stock value (quantity × avg_price)' })
  total_value: Decimal;

  @ApiProperty({ example: 'RAW', description: 'Item type' })
  item_type: string;

  @ApiProperty({ example: 'Auto Parts', description: 'Category name' })
  category_name: string;
}
