import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsInt, IsOptional, Min } from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class ReceiptFilterDto extends PaginationDto {
  @ApiPropertyOptional({ example: 1, description: 'Filter by customer ID' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  customer_id?: number;

  @ApiPropertyOptional({
    example: '2026-02-01T00:00:00.000Z',
    description: 'Filter receipts from this date',
  })
  @IsDateString()
  @IsOptional()
  from_date?: string;

  @ApiPropertyOptional({
    example: '2026-02-28T23:59:59.999Z',
    description: 'Filter receipts up to this date',
  })
  @IsDateString()
  @IsOptional()
  to_date?: string;
}
