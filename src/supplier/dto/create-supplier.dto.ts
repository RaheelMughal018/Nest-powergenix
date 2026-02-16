import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateSupplierDto {
  @ApiProperty({ example: 'Ahmad Traders' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'Ahmad Traders Ltd' })
  @IsString()
  company_name: string;

  @ApiPropertyOptional({ example: '03333333333' })
  @IsString()
  phone: string;

  @ApiPropertyOptional({ example: '123 Main St, Anytown, USA' })
  @IsString()
  address: string;

  @ApiPropertyOptional({
    example: 5000.0,
    description: 'Opening balance of the supplier',
  })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  opening_balance: number;
}
