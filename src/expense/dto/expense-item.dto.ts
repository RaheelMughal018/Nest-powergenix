import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNumber, IsString, IsOptional, Min, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';

/** Single expense item for bulk create by day (no date - uses the day from parent). */
export class ExpenseItemDto {
  @ApiProperty({ example: 1, description: 'Expense category ID' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  category_id: number;

  @ApiProperty({ example: 1, description: 'Account ID' })
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

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}
