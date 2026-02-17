import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsEnum, IsInt, IsString, MaxLength, Min, MinLength, IsNotEmpty } from 'class-validator';
import { ItemType, UnitType } from '@prisma/client';

export class CreateItemDto {
  @ApiProperty({ 
    example: 'Steel Wheel', 
    description: 'Name of the item (unique within category, case-insensitive)' 
  })
  @IsString({ message: 'Item name must be a string' })
  @IsNotEmpty({ message: 'Item name cannot be empty' })
  @MinLength(2, { message: 'Item name must be at least 2 characters long' })
  @MaxLength(255, { message: 'Item name cannot exceed 255 characters' })
  @Transform(({ value }) => value?.trim())
  name: string;

  @ApiProperty({ 
    enum: ItemType, 
    example: ItemType.RAW, 
    description: 'Type of item: RAW (raw materials) or FINAL (finished products). Cannot be changed after creation.' 
  })
  @IsEnum(ItemType, { message: 'Item type must be either RAW or FINAL' })
  item_type: ItemType;

  @ApiProperty({ 
    enum: UnitType, 
    example: UnitType.PCS, 
    description: 'Unit type: PCS (pieces) or SET. Defaults to PCS.' 
  })
  @IsEnum(UnitType, { message: 'Unit type must be either PCS or SET' })
  unit_type: UnitType;

  @ApiProperty({ 
    example: 1, 
    description: 'Category ID - must exist in the system' 
  })
  @Type(() => Number)
  @IsInt({ message: 'Category ID must be an integer' })
  @Min(1, { message: 'Category ID must be a positive number' })
  category_id: number;
}
