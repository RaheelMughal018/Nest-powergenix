import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { AccountType } from '@prisma/client';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class AccountFilterDto extends PaginationDto {
  @ApiPropertyOptional({
    description: 'Filter by account type',
    enum: AccountType,
    example: AccountType.BANK,
  })
  @IsEnum(AccountType, { message: 'Invalid account type' })
  @IsOptional()
  account_type?: AccountType;
}
