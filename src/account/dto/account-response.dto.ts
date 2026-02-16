import { ApiProperty } from '@nestjs/swagger';
import { Decimal } from '@prisma/client/runtime/library';

export class AccountResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'Main Business Account' })
  name: string;

  @ApiProperty({ example: 'BANK' })
  account_type: string;

  @ApiProperty({ example: '1234567890', nullable: true })
  account_number: string | null;

  @ApiProperty({ example: 'Allied Bank', nullable: true })
  bank_name: string | null;

  @ApiProperty({ example: '50000.00' })
  opening_balance: Decimal;

  @ApiProperty({ example: '75000.00', description: 'Calculated current balance' })
  current_balance: Decimal;

  @ApiProperty({ example: '2024-01-15T10:30:00.000Z' })
  created_at: Date;

  @ApiProperty({ example: '2024-01-15T10:30:00.000Z' })
  updated_at: Date;
}
