import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, ValidateNested } from 'class-validator';
import { ProductionIngredientDto } from './production-ingredient.dto';

export class UpdateProductionIngredientsDto {
  @ApiProperty({ type: [ProductionIngredientDto], description: 'Replace production ingredients for this batch only' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductionIngredientDto)
  ingredients: ProductionIngredientDto[];
}
