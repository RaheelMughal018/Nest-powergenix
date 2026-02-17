import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsArray,
  ValidateNested,
  MaxLength,
  Min,
} from 'class-validator';
import { RecipeIngredientDto } from './recipe-ingredient.dto';

export class CreateRecipeDto {
  @ApiProperty({ example: 'Build a Car', description: 'Recipe name' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional({ example: 'Standard car assembly', description: 'Optional description' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiProperty({
    example: 1,
    description: 'Final product item ID (must be ItemType.FINAL). One item can have at most one recipe.',
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  final_product_id: number;

  @ApiProperty({
    type: [RecipeIngredientDto],
    description: 'Ingredients: quantity per unit of final product. Cost is calculated dynamically from current item avg_price.',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RecipeIngredientDto)
  ingredients: RecipeIngredientDto[];
}
