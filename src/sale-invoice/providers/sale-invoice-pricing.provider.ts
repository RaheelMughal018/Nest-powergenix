import { BadRequestException, Injectable } from '@nestjs/common';
import { PaymentStatus } from '@prisma/client';
import { CreateSaleInvoiceDto } from '../dto/create-sale-invoice.dto';
import { InvoiceTotals, ResolvedLineItem } from './types';

@Injectable()
export class SaleInvoicePricingProvider {
  /**
   * Computes subtotal, tax, discount, total amount, received amount, payment status, and dates.
   * Validates received_amount does not exceed total_amount.
   */
  calculate(resolvedItems: ResolvedLineItem[], dto: CreateSaleInvoiceDto): InvoiceTotals {
    const subtotal = resolvedItems.reduce((s, i) => s + i.total_price, 0);
    const tax = Number(dto.tax ?? 0);
    const discount = Number(dto.discount ?? 0);
    const totalAmount = subtotal - discount + tax;

    let receivedAmount = Number(dto.received_amount ?? 0);
    let paymentStatus = dto.payment_status;
    if (paymentStatus === PaymentStatus.PAID) {
      receivedAmount = totalAmount;
    } else if (paymentStatus === PaymentStatus.UNPAID) {
      receivedAmount = 0;
    }

    if (receivedAmount > totalAmount) {
      throw new BadRequestException('received_amount cannot exceed total_amount');
    }

    const invoiceDate = dto.invoice_date ? new Date(dto.invoice_date) : new Date();
    const dueDate = dto.due_date ? new Date(dto.due_date) : null;

    return {
      subtotal,
      tax,
      discount,
      totalAmount,
      receivedAmount,
      paymentStatus,
      invoiceDate,
      dueDate,
    };
  }
}
