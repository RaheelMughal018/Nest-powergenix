import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SupplierResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'Ahmad Traders' })
  name: string;

  @ApiPropertyOptional({ example: 'Ahmad Traders Ltd' })
  company_name?: string;

  @ApiPropertyOptional({ example: '03333333333' })
  phone?: string;

  @ApiPropertyOptional({ example: '123 Main St, Anytown, USA' })
  address?: string;

  @ApiProperty({ example: 5000.0 })
  opening_balance: number;

  @ApiProperty({ example: 5000.0 })
  current_balance: number;

  @ApiProperty({ example: '2026-02-15T10:30:00.000Z' })
  created_at: Date;

  @ApiProperty({ example: '2026-02-15T10:30:00.000Z' })
  updated_at: Date;
}
