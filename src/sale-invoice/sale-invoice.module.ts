import { Module } from '@nestjs/common';
import { SaleInvoiceController } from './sale-invoice.controller';
import { SaleInvoiceAccountingProvider } from './providers/sale-invoice-accounting.provider';
import { SaleInvoiceInventoryProvider } from './providers/sale-invoice-inventory.provider';
import { SaleInvoicePaymentProvider } from './providers/sale-invoice-payment.provider';
import { SaleInvoicePricingProvider } from './providers/sale-invoice-pricing.provider';
import { SaleInvoiceRepository } from './providers/sale-invoice-repository';
import { SaleInvoiceService } from './sale-invoice.service';

@Module({
  controllers: [SaleInvoiceController],
  providers: [
    SaleInvoiceService,
    SaleInvoiceInventoryProvider,
    SaleInvoicePricingProvider,
    SaleInvoiceRepository,
    SaleInvoiceAccountingProvider,
    SaleInvoicePaymentProvider,
  ],
  exports: [SaleInvoiceService],
})
export class SaleInvoiceModule {}
