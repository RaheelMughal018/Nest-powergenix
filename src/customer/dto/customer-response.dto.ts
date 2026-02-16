import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CustomerResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'John Doe' })
  name: string;

  @ApiPropertyOptional({ example: 'John Enterprises' })
  company_name?: string;

  @ApiPropertyOptional({ example: '03331234567' })
  phone?: string;

  @ApiPropertyOptional({ example: '456 Market St, Karachi' })
  address?: string;

  @ApiProperty({ example: 3000.0 })
  opening_balance: number;

  @ApiProperty({ example: 3000.0 })
  current_balance: number;

  @ApiProperty({ example: '2026-02-15T10:30:00.000Z' })
  created_at: Date;

  @ApiProperty({ example: '2026-02-15T10:30:00.000Z' })
  updated_at: Date;
}
