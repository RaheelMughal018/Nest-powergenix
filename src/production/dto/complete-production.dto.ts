import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsString,
  ArrayMinSize,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CompleteProductionDto {
  @ApiProperty({
    example: ['LEH-001', 'LEH-007'],
    description:
      'Exact serial numbers for each unit. Length must match production quantity (e.g. 2 products → 2 serials).',
    type: [String],
    minItems: 1,
  })
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1, { message: 'At least one serial number is required' })
  @MaxLength(100, { each: true })
  @MinLength(1, { each: true, message: 'Each serial number must be non-empty' })
  serialNumbers: string[];
}
