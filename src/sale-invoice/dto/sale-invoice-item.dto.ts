import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsNumber, IsOptional, IsString, Min } from 'class-validator';

/**
 * Line item for sale invoice.
 * - FINAL product: provide item_id + serial_number (quantity is always 1).
 * - RAW item: provide item_id + quantity (unit_price comes from Item.avg_price).
 */
export class SaleInvoiceItemDto {
  @ApiProperty({ example: 1, description: 'Item ID (final product or raw item)' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  item_id: number;

  /** For FINAL products: unique serial number of the unit. Quantity is always 1. */
  @ApiPropertyOptional({ example: 'LEH-001', description: 'Serial number (FINAL products only)' })
  @IsOptional()
  @IsString()
  serial_number?: string;

  /** For RAW items: quantity to sell. Required when serial_number is not provided. */
  @ApiPropertyOptional({ example: 5, description: 'Quantity (RAW items only)' })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @IsOptional()
  quantity?: number;
}
