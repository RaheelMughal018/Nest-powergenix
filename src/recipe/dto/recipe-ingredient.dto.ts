import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsNumber, Min } from 'class-validator';

export class RecipeIngredientDto {
  @ApiProperty({ example: 1, description: 'Item ID (raw material)' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  item_id: number;

  @ApiProperty({ example: 2.5, description: 'Quantity per unit of final product' })
  @Type(() => Number)
  @IsNumber()
  @Min(0.001)
  quantity: number;
}
