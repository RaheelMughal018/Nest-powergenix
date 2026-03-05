import { Module } from '@nestjs/common';
import { RepairInvoiceController } from './repair-invoice.controller';
import { RepairInvoiceService } from './repair-invoice.service';

@Module({
  controllers: [RepairInvoiceController],
  providers: [RepairInvoiceService],
  exports: [RepairInvoiceService],
})
export class RepairInvoiceModule {}
