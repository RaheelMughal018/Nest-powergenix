import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString } from 'class-validator';
import { ItemType } from '@prisma/client';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class ItemFilterDto extends PaginationDto {
  @ApiPropertyOptional({ enum: ItemType, example: ItemType.RAW })
  @IsEnum(ItemType)
  @IsOptional()
  item_type?: ItemType;

  @ApiPropertyOptional({ example: 1 })
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  category_id?: number;

  @ApiPropertyOptional({ enum: ['in_stock', 'out_of_stock'] })
  @IsString()
  @IsOptional()
  stock_status?: string;
}
