import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, MaxLength } from 'class-validator';

export class UpdateAccountDto {
  @ApiPropertyOptional({
    description: 'Account name',
    example: 'Updated Business Account',
    maxLength: 100,
  })
  @IsString()
  @IsOptional()
  @MaxLength(100, { message: 'Account name must not exceed 100 characters' })
  name?: string;

  @ApiPropertyOptional({
    description: 'Account number',
    example: '9876543210',
    maxLength: 50,
  })
  @IsString()
  @IsOptional()
  @MaxLength(50, { message: 'Account number must not exceed 50 characters' })
  account_number?: string;

  @ApiPropertyOptional({
    description: 'Bank name',
    example: 'HBL Bank',
    maxLength: 100,
  })
  @IsString()
  @IsOptional()
  @MaxLength(100, { message: 'Bank name must not exceed 100 characters' })
  bank_name?: string;
}
