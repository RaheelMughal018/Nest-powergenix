import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateProductionDto {
  @ApiPropertyOptional({ description: 'Notes (only editable in DRAFT)' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}
