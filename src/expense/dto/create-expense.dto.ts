import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNumber, IsString, IsOptional, Min, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateExpenseDto {
  @ApiProperty({ example: 1, description: 'Expense category ID' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  category_id: number;

  @ApiProperty({ example: 1, description: 'Account ID (money taken from)' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  account_id: number;

  @ApiProperty({ example: 500.5, description: 'Amount' })
  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiProperty({ example: 'Office supplies', description: 'Description' })
  @IsString()
  @MaxLength(500)
  description: string;

  @ApiPropertyOptional({ example: '2026-02-17', description: 'Expense date (default: today)' })
  @IsOptional()
  @IsString()
  expense_date?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  receipt_image?: string;
}
