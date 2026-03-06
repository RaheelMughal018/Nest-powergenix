import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional } from 'class-validator';

export class DateRangeDto {
  @ApiPropertyOptional({ example: '2024-03-01', description: 'Start date (YYYY-MM-DD)' })
  @IsDateString()
  @IsOptional()
  start?: string;

  @ApiPropertyOptional({ example: '2024-03-31', description: 'End date (YYYY-MM-DD)' })
  @IsDateString()
  @IsOptional()
  end?: string;
}
