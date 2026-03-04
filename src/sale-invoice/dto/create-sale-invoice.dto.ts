import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { SaleInvoiceItemDto } from './sale-invoice-item.dto';

export class CreateSaleInvoiceDto {
  @ApiProperty({ example: 1, description: 'Customer ID' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  customer_id: number;

  @ApiPropertyOptional({
    example: '2026-02-23T10:30:00.000Z',
    description: 'Invoice date',
  })
  @IsDateString()
  @IsOptional()
  invoice_date?: string;

  @ApiPropertyOptional({
    example: '2026-03-23T10:30:00.000Z',
    description: 'Due date for payment',
  })
  @IsDateString()
  @IsOptional()
  due_date?: string;

  @ApiProperty({
    type: [SaleInvoiceItemDto],
    description:
      'Line items: FINAL products use item_id + serial_number; RAW items use item_id + quantity',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SaleInvoiceItemDto)
  items: SaleInvoiceItemDto[];

  @ApiPropertyOptional({ example: 0, description: 'Tax amount' })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  tax?: number;

  @ApiPropertyOptional({ example: 0, description: 'Discount amount' })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  discount?: number;

  @ApiProperty({
    enum: PaymentStatus,
    example: PaymentStatus.UNPAID,
    description: 'Payment status',
  })
  @IsEnum(PaymentStatus)
  payment_status: PaymentStatus;

  @ApiPropertyOptional({
    example: 1,
    description: 'Account ID (required when payment_status is PAID or PARTIAL)',
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  account_id?: number;

  @ApiPropertyOptional({
    example: 5000,
    description:
      'Amount received (required when payment_status is PAID or PARTIAL). For PAID use total_amount; for PARTIAL use any amount < total.',
  })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  received_amount?: number;

  @ApiPropertyOptional({ example: 'Additional notes' })
  @IsString()
  @IsOptional()
  notes?: string;
}
