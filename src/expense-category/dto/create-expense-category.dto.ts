import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, MaxLength, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateExpenseCategoryDto {
  @ApiProperty({ example: 'Utilities', description: 'Unique category name' })
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  @Transform(({ value }) => value?.trim())
  name: string;

  @ApiPropertyOptional({ example: 'Electricity, gas, water', description: 'Optional description' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  @Transform(({ value }) => value?.trim() || undefined)
  description?: string;
}
