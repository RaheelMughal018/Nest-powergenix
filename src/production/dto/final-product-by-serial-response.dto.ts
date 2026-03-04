import { ApiProperty } from '@nestjs/swagger';
import { ItemType, UnitType } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

class CategoryInfoDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;
}

class FinalProductItemDto {
  @ApiProperty({ description: 'Item (final product) ID' })
  id: number;

  @ApiProperty()
  name: string;

  @ApiProperty({ enum: ItemType })
  item_type: ItemType;

  @ApiProperty({ enum: UnitType })
  unit_type: UnitType;

  @ApiProperty()
  category_id: number;

  @ApiProperty({ type: CategoryInfoDto, description: 'Category of the final product' })
  category: CategoryInfoDto;
}

class ProductionSummaryDto {
  @ApiProperty({ description: 'Production batch ID' })
  id: number;

  @ApiProperty({ description: 'Batch number' })
  batch_number: string;

  @ApiProperty({ nullable: true, description: 'When the production was completed' })
  completion_date: Date | null;

  @ApiProperty({ description: 'Recipe name' })
  recipe_name: string;
}

export class FinalProductBySerialResponseDto {
  @ApiProperty({ description: 'Production item (unit) ID' })
  id: number;

  @ApiProperty({ description: 'Unique serial number of this unit' })
  serial_number: string;

  @ApiProperty({ description: 'Cost price locked at production completion' })
  cost_price: Decimal;

  @ApiProperty({ description: 'Whether this unit has been sold' })
  is_sold: boolean;

  @ApiProperty({ description: 'When this unit was produced' })
  created_at: Date;

  @ApiProperty({ type: FinalProductItemDto, description: 'The final product (item) this serial belongs to' })
  item: FinalProductItemDto;

  @ApiProperty({ type: ProductionSummaryDto, description: 'Production batch this unit belongs to' })
  production: ProductionSummaryDto;
}
