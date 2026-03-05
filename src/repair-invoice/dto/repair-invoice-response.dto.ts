import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ItemType, PaymentStatus, RepairStatus } from '@prisma/client';

export class RepairInvoiceItemResponseDto {
  @ApiProperty()
  id: number;

  @ApiPropertyOptional()
  item_id?: number | null;

  @ApiProperty()
  description: string;

  @ApiProperty()
  quantity: number | string;

  @ApiProperty()
  unit_price: number | string;

  @ApiProperty()
  total_price: number | string;

  @ApiPropertyOptional()
  cost_price?: number | string | null;

  @ApiProperty({ description: 'If true: included in total but no stock deduction' })
  is_bush: boolean;
}

export class RepairInvoiceResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty({ example: 'RINV-2026-0001' })
  invoice_number: string;

  @ApiProperty()
  customer_id: number;

  @ApiPropertyOptional()
  customer_name?: string;

  @ApiPropertyOptional({ enum: ItemType })
  item_type?: ItemType | null;

  @ApiPropertyOptional()
  production_item_id?: number | null;

  @ApiPropertyOptional()
  serial_number?: string | null;

  @ApiPropertyOptional()
  item_id?: number | null;

  @ApiPropertyOptional()
  item_description?: string | null;

  @ApiProperty()
  is_foc: boolean;

  @ApiProperty({ enum: RepairStatus })
  repair_status: RepairStatus;

  @ApiProperty()
  received_date: Date;

  @ApiPropertyOptional()
  repair_date?: Date | null;

  @ApiPropertyOptional()
  delivery_date?: Date | null;

  @ApiProperty()
  parts_cost: number | string;

  @ApiProperty()
  service_charges: number | string;

  @ApiProperty()
  total_amount: number | string;

  @ApiProperty()
  received_amount: number | string;

  @ApiProperty({ enum: PaymentStatus })
  payment_status: PaymentStatus;

  @ApiPropertyOptional()
  notes?: string | null;

  @ApiPropertyOptional()
  technician_notes?: string | null;

  @ApiProperty({ type: [RepairInvoiceItemResponseDto] })
  items: RepairInvoiceItemResponseDto[];
}
