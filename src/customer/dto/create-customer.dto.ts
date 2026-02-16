import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateCustomerDto {
  @ApiProperty({ example: 'John Doe' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'John Enterprises' })
  @IsString()
  @IsOptional()
  company_name?: string;

  @ApiPropertyOptional({ example: '03331234567' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({ example: '456 Market St, Karachi' })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiPropertyOptional({
    example: 3000.0,
    description: 'Opening balance of the customer',
  })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  opening_balance?: number;
}
