import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreatePaymentDto {
  @ApiProperty({ example: 1, description: 'Supplier ID' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  supplier_id: number;

  @ApiProperty({ example: 1, description: 'Account ID (where money comes from)' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  account_id: number;

  @ApiProperty({ example: 5000.0, description: 'Payment amount' })
  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiPropertyOptional({
    example: '2026-02-16T10:30:00.000Z',
    description: 'Payment date',
  })
  @IsDateString()
  @IsOptional()
  payment_date?: string;

  @ApiPropertyOptional({ example: 'Direct payment to clear balance' })
  @IsString()
  @IsOptional()
  notes?: string;
}
