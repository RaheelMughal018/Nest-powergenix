import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, IsString, IsNotEmpty, MinLength, MaxLength, IsOptional, Min } from 'class-validator';

export class AdjustStockDto {
  @ApiProperty({
    example: 50.5,
    description: 'Quantity to add (positive) or remove (negative). Cannot remove more than available stock.',
  })
  @Type(() => Number)
  @IsNumber({}, { message: 'Quantity must be a number' })
  @IsNotEmpty({ message: 'Quantity is required' })
  quantity: number;

  @ApiProperty({
    example: 250.0,
    description: 'Unit price for this adjustment. Required when adding stock (quantity > 0). Ignored when removing stock.',
  })
  @Type(() => Number)
  @IsNumber({}, { message: 'Unit price must be a number' })
  @Min(0, { message: 'Unit price cannot be negative' })
  @IsNotEmpty({ message: 'Unit price is required' })
  unit_price: number;

  @ApiProperty({
    example: 'Opening Stock',
    description: 'Reason for stock adjustment (e.g., "Opening Stock", "Damaged", "Found", "Correction")',
    minLength: 2,
    maxLength: 255,
  })
  @IsString({ message: 'Reason must be a string' })
  @IsNotEmpty({ message: 'Reason is required' })
  @MinLength(2, { message: 'Reason must be at least 2 characters long' })
  @MaxLength(255, { message: 'Reason cannot exceed 255 characters' })
  reason: string;

  @ApiPropertyOptional({
    example: 'Received from warehouse A',
    description: 'Additional notes about this stock adjustment',
  })
  @IsString({ message: 'Notes must be a string' })
  @IsOptional()
  notes?: string;
}
