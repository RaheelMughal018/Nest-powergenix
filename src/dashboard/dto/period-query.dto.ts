import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Min } from 'class-validator';

export type DashboardPeriod = 'today' | 'week' | 'month';

export class PeriodQueryDto {
  @ApiPropertyOptional({ enum: ['today', 'week', 'month'], default: 'month' })
  @IsEnum(['today', 'week', 'month'])
  @IsOptional()
  period?: DashboardPeriod = 'month';
}

export class LimitQueryDto {
  @ApiPropertyOptional({ default: 10, minimum: 1, maximum: 50 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  limit?: number = 10;
}

export class DaysQueryDto {
  @ApiPropertyOptional({ default: 30, description: 'Number of days for trends' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  days?: number = 30;
}
