import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsOptional,
  IsString,
  IsArray,
  ValidateNested,
  MaxLength,
} from 'class-validator';
import { RecipeIngredientDto } from './recipe-ingredient.dto';

export class UpdateRecipeDto {
  @ApiPropertyOptional({ example: 'Build a Car v2', description: 'Recipe name' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @ApiPropertyOptional({ description: 'Optional description' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiPropertyOptional({
    type: [RecipeIngredientDto],
    description: 'Replace all ingredients. Omit to keep existing.',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RecipeIngredientDto)
  ingredients?: RecipeIngredientDto[];
}
