import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsEnum, IsOptional, IsNumber, Min, MaxLength } from 'class-validator';
import { AccountType } from '@prisma/client';
import { Type } from 'class-transformer';

export class CreateAccountDto {
  @ApiProperty({
    description: 'Account name',
    example: 'Main Business Account',
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty({ message: 'Account name is required' })
  @MaxLength(100, { message: 'Account name must not exceed 100 characters' })
  name: string;

  @ApiProperty({
    description: 'Type of account',
    enum: AccountType,
    example: AccountType.BANK,
  })
  @IsEnum(AccountType, { message: 'Invalid account type' })
  @IsNotEmpty({ message: 'Account type is required' })
  account_type: AccountType;

  @ApiProperty({
    description: 'Account number (required for BANK type)',
    example: '1234567890',
    required: false,
    maxLength: 50,
  })
  @IsString()
  @IsOptional()
  @MaxLength(50, { message: 'Account number must not exceed 50 characters' })
  account_number?: string;

  @ApiProperty({
    description: 'Bank name (required for BANK type)',
    example: 'Allied Bank',
    required: false,
    maxLength: 100,
  })
  @IsString()
  @IsOptional()
  @MaxLength(100, { message: 'Bank name must not exceed 100 characters' })
  bank_name?: string;

  @ApiProperty({
    description: 'Opening balance for the account',
    example: 50000.00,
    required: false,
    default: 0,
  })
  @IsNumber({}, { message: 'Opening balance must be a number' })
  @IsOptional()
  @Type(() => Number)
  @Min(0, { message: 'Opening balance cannot be negative' })
  opening_balance?: number;
}
