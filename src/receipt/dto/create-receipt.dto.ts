import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsInt, IsNumber, IsOptional, IsString, Min } from 'class-validator';

/**
 * Direct receipt (no invoice). Use for advance payment, settlement of old debt, etc.
 * Invoice-linked receipts are created automatically when a sale invoice is PAID or PARTIAL.
 */
export class CreateReceiptDto {
  @ApiProperty({ example: 1, description: 'Customer ID' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  customer_id: number;

  @ApiProperty({ example: 1, description: 'Account ID (money received into this account)' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  account_id: number;

  @ApiProperty({ example: 5000, description: 'Amount received' })
  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiPropertyOptional({ example: '2026-02-23T10:30:00.000Z', description: 'Receipt date' })
  @IsDateString()
  @IsOptional()
  receipt_date?: string;

  @ApiPropertyOptional({ example: 'Advance payment' })
  @IsString()
  @IsOptional()
  notes?: string;
}
