import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { PurchaseInvoiceItemDto } from './create-purchase-invoice.dto';

export class UpdatePurchaseInvoiceDto {
  @ApiPropertyOptional({
    example: '2026-02-16T10:30:00.000Z',
    description: 'Invoice date',
  })
  @IsDateString()
  @IsOptional()
  invoice_date?: string;

  @ApiPropertyOptional({
    example: '2026-03-16T10:30:00.000Z',
    description: 'Due date for payment',
  })
  @IsDateString()
  @IsOptional()
  due_date?: string;

  @ApiPropertyOptional({
    type: [PurchaseInvoiceItemDto],
    description: 'Array of items to purchase',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PurchaseInvoiceItemDto)
  @IsOptional()
  items?: PurchaseInvoiceItemDto[];

  @ApiPropertyOptional({ example: 100.0, description: 'Tax amount' })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  tax?: number;

  @ApiPropertyOptional({ example: 50.0, description: 'Discount amount' })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  discount?: number;

  @ApiPropertyOptional({ example: 'Additional notes' })
  @IsString()
  @IsOptional()
  notes?: string;
}
