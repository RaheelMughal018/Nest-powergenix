import { ApiProperty } from '@nestjs/swagger';

export class CategoryResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'Electronics' })
  name: string;

  @ApiProperty({ example: '2026-02-15T10:30:00.000Z' })
  created_at: Date;

  @ApiProperty({ example: '2026-02-15T10:30:00.000Z' })
  updated_at: Date;
}
