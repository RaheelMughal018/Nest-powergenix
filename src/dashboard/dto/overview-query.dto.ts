import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsInt, IsOptional, Min, Max } from 'class-validator';

export class OverviewQueryDto {
  @ApiPropertyOptional({
    example: '2024-03-15',
    description: 'Date for "today" metrics (YYYY-MM-DD). If omitted, uses current date.',
  })
  @IsDateString()
  @IsOptional()
  date?: string;

  @ApiPropertyOptional({
    default: 7,
    minimum: 1,
    maximum: 90,
    description: 'Number of days for sales/purchases/repairs trends.',
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(90)
  @IsOptional()
  days?: number = 7;
}
