import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsInt, IsOptional, Min, IsBoolean } from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class PaymentFilterDto extends PaginationDto {
  @ApiPropertyOptional({ example: 1, description: 'Filter by supplier ID' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  supplier_id?: number;

  @ApiPropertyOptional({ example: 1, description: 'Filter by account ID' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  account_id?: number;

  @ApiPropertyOptional({
    example: true,
    description: 'Filter direct payments only (not linked to invoice)',
  })
  @Type(() => Boolean)
  @IsBoolean()
  @IsOptional()
  direct_only?: boolean;

  @ApiPropertyOptional({
    example: '2026-02-01T00:00:00.000Z',
    description: 'Filter from date',
  })
  @IsDateString()
  @IsOptional()
  from_date?: string;

  @ApiPropertyOptional({
    example: '2026-02-28T23:59:59.999Z',
    description: 'Filter to date',
  })
  @IsDateString()
  @IsOptional()
  to_date?: string;
}
