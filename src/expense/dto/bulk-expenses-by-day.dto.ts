import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsDateString, ArrayMinSize, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ExpenseItemDto } from './expense-item.dto';

export class BulkExpensesByDayDto {
  @ApiProperty({
    example: '2026-02-17',
    description: 'Date for all expenses (YYYY-MM-DD). All items will use this as expense_date.',
  })
  @IsDateString()
  date: string;

  @ApiProperty({
    type: [ExpenseItemDto],
    example: [
      { category_id: 1, account_id: 1, amount: 100, description: 'Lunch' },
      { category_id: 2, account_id: 1, amount: 50, description: 'Transport', notes: 'Uber' },
    ],
    description: 'List of expenses for this day.',
  })
  @IsArray()
  @ArrayMinSize(1, { message: 'At least one expense is required' })
  @ValidateNested({ each: true })
  @Type(() => ExpenseItemDto)
  expenses: ExpenseItemDto[];
}
