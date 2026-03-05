import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ItemType, PaymentStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { RepairInvoiceItemDto } from './repair-invoice-item.dto';

export class CreateRepairInvoiceDto {
  @ApiProperty({ example: 1, description: 'Customer ID' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  customer_id: number;

  @ApiProperty({
    example: false,
    description: 'Free of cost (no payment/ledger). Independent of item type.',
  })
  @Type(() => Boolean)
  @IsBoolean()
  @IsOptional()
  is_foc?: boolean;

  // ─── Item being repaired ─────────────────────────────────────────────────
  /** FINAL: production_item_id + serial_number */
  @ApiPropertyOptional({ description: 'Production item ID (when repairing FINAL with serial)' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  production_item_id?: number;

  @ApiPropertyOptional({ example: 'LEH-001', description: 'Serial number (when FINAL product)' })
  @IsString()
  @IsOptional()
  serial_number?: string;

  /** RAW: item from inventory */
  @ApiPropertyOptional({ description: 'Item ID from inventory (when repairing RAW item)' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  item_id?: number;

  @ApiPropertyOptional({ enum: ItemType, description: 'FINAL or RAW (when item_id or production_item_id used)' })
  @IsEnum(ItemType)
  @IsOptional()
  item_type?: ItemType;

  /** External: not in inventory */
  @ApiPropertyOptional({ example: "Customer's laptop", description: 'When item not in inventory' })
  @IsString()
  @IsOptional()
  item_description?: string;

  @ApiPropertyOptional({ description: 'Date item received' })
  @IsDateString()
  @IsOptional()
  received_date?: string;

  @ApiProperty({
    type: [RepairInvoiceItemDto],
    description: 'Lines: all add to total. is_bush=true = no stock deduction. item_id + !is_bush = real part (stock at IN_PROGRESS).',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RepairInvoiceItemDto)
  items: RepairInvoiceItemDto[];

  // ─── Payment (only if NOT is_foc) ───────────────────────────────────────
  @ApiPropertyOptional({ enum: PaymentStatus })
  @IsEnum(PaymentStatus)
  @IsOptional()
  payment_status?: PaymentStatus;

  @ApiPropertyOptional({ description: 'Account ID when payment_status is PAID or PARTIAL' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  account_id?: number;

  @ApiPropertyOptional({ description: 'Amount received (for PAID/PARTIAL)' })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  received_amount?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({ description: 'Internal technician notes' })
  @IsString()
  @IsOptional()
  technician_notes?: string;
}
