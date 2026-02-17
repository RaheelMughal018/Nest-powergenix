import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class CreateProductionDto {
  @ApiProperty({ example: 1, description: 'Recipe ID' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  recipe_id: number;

  @ApiProperty({ example: 10, description: 'Number of units to produce' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity: number;

  @ApiProperty({ example: 'BATCH-2025-001', description: 'Unique batch number' })
  @IsString()
  @MaxLength(50)
  batch_number: string;

  @ApiPropertyOptional({ description: 'Optional notes' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}
