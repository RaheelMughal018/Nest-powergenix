import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsInt, IsNumber, IsOptional, IsString, Min } from 'class-validator';

/**
 * Line item for repair invoice.
 * - All lines (bush or not) are included in total_amount.
 * - If item_id set and is_bush = false: real part from stock (deducted when status → IN_PROGRESS). Must be RAW.
 * - If is_bush = true: amount is added to total but we do NOT deduct from stock (e.g. markup, fake part entry).
 */
export class RepairInvoiceItemDto {
  @ApiPropertyOptional({
    description: 'Item ID (for real parts from stock). Must be RAW. Omit for labor/bush.',
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  item_id?: number;

  @ApiProperty({ example: 'Engine replacement', description: 'Description (part name, labor, or bush label)' })
  @IsString()
  description: string;

  @ApiProperty({ example: 1, description: 'Quantity' })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  quantity: number;

  @ApiProperty({ example: 5000, description: 'Unit price (charged to customer for this line)' })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  unit_price: number;

  @ApiProperty({
    example: false,
    description: 'If true: line is included in total but we do NOT deduct item from stock.',
  })
  @Type(() => Boolean)
  @IsBoolean()
  @IsOptional()
  is_bush?: boolean;
}
