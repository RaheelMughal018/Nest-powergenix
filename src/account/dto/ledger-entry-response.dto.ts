import { ApiProperty } from '@nestjs/swagger';

export class LedgerEntryResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: '2024-01-15T10:30:00.000Z' })
  date: Date;

  @ApiProperty({ example: 'Opening Balance' })
  description: string;

  @ApiProperty({ example: 'DEBIT' })
  type: string;

  @ApiProperty({ example: 5000.00 })
  amount: number;

  @ApiProperty({ example: 5000.00 })
  balance: number;

  @ApiProperty({ example: 'INV-001', nullable: true })
  reference: string | null;
}
