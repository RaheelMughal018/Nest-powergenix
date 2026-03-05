import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { RepairStatus } from '@prisma/client';

export class UpdateRepairStatusDto {
  @ApiProperty({
    enum: RepairStatus,
    description: 'PENDING → IN_PROGRESS (deduct parts) → COMPLETED → DELIVERED',
  })
  @IsEnum(RepairStatus)
  repair_status: RepairStatus;
}
