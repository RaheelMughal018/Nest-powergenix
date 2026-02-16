import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength, IsNotEmpty } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateCategoryDto {
  @ApiProperty({ 
    example: 'Auto Parts', 
    description: 'Unique category name (case-insensitive, 2-100 characters)' 
  })
  @IsString({ message: 'Category name must be a string' })
  @IsNotEmpty({ message: 'Category name cannot be empty' })
  @MinLength(2, { message: 'Category name must be at least 2 characters long' })
  @MaxLength(100, { message: 'Category name cannot exceed 100 characters' })
  @Transform(({ value }) => value?.trim())
  name: string;
}
