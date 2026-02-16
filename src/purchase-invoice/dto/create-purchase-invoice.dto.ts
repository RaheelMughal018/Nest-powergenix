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

export class PurchaseInvoiceItemDto {
  @ApiProperty({ example: 1, description: 'Item ID' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  item_id: number;

  @ApiProperty({ example: 10, description: 'Quantity to purchase' })
  @Type(() => Number)
  @IsNumber()
  @Min(0.001)
  quantity: number;

  @ApiProperty({ example: 500.0, description: 'Unit price' })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  unit_price: number;
}

export class CreatePurchaseInvoiceDto {
  @ApiProperty({ example: 1, description: 'Supplier ID' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  supplier_id: number;

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

  @ApiProperty({
    type: [PurchaseInvoiceItemDto],
    description: 'Array of items to purchase',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PurchaseInvoiceItemDto)
  items: PurchaseInvoiceItemDto[];

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

  @ApiProperty({
    enum: PaymentStatus,
    example: PaymentStatus.UNPAID,
    description: 'Payment status',
  })
  @IsEnum(PaymentStatus)
  payment_status: PaymentStatus;

  @ApiPropertyOptional({
    example: 1,
    description: 'Account ID (required if payment_status is PAID or PARTIAL)',
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  account_id?: number;

  @ApiPropertyOptional({
    example: 5000.0,
    description:
      'Amount paid at purchase (required if payment_status is PAID or PARTIAL)',
  })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  paid_amount?: number;

  @ApiPropertyOptional({ example: 'Additional notes' })
  @IsString()
  @IsOptional()
  notes?: string;
}
