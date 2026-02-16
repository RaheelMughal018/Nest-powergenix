import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsDateString, IsEnum, IsInt, IsOptional, Min } from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class PurchaseInvoiceFilterDto extends PaginationDto {
  @ApiPropertyOptional({ example: 1, description: 'Filter by supplier ID' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  supplier_id?: number;

  @ApiPropertyOptional({
    enum: PaymentStatus,
    description: 'Filter by payment status',
  })
  @IsEnum(PaymentStatus)
  @IsOptional()
  payment_status?: PaymentStatus;

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
