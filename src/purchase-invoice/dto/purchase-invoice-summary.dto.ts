import { ApiProperty } from '@nestjs/swagger';

export class PurchaseInvoiceSummaryDto {
  @ApiProperty({ example: 150, description: 'Total number of invoices' })
  total_invoices: number;

  @ApiProperty({
    example: '500000.00',
    description: 'Total amount of all invoices',
  })
  total_amount: string;

  @ApiProperty({ example: 50, description: 'Number of paid invoices' })
  paid_count: number;

  @ApiProperty({ example: 30, description: 'Number of unpaid invoices' })
  unpaid_count: number;

  @ApiProperty({ example: 70, description: 'Number of partial paid invoices' })
  partial_count: number;

  @ApiProperty({
    example: '150000.00',
    description: 'Total outstanding amount',
  })
  outstanding_amount: string;

  @ApiProperty({
    example: '350000.00',
    description: 'Total paid amount',
  })
  paid_amount: string;
}
