import { Injectable } from '@nestjs/common';
import { Decimal } from '@prisma/client/runtime/library';
import { PrismaService } from '../../common/database/prisma.service';
import { CreateSaleInvoiceDto } from '../dto/create-sale-invoice.dto';
import { InvoiceTotals, ResolvedLineItem, SaleInvoiceTx } from './types';
import { SaleInvoice } from '@prisma/client';

@Injectable()
export class SaleInvoiceRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Generates next invoice number (SINV-YYYY-NNNN).
   */
  async generateInvoiceNumber(
    tx?: SaleInvoiceTx,
  ): Promise<string> {
    const client = tx ?? this.prisma;
    const year = new Date().getFullYear();
    const prefix = `SINV-${year}-`;
    const lastInvoice = await client.saleInvoice.findFirst({
      where: { invoice_number: { startsWith: prefix } },
      orderBy: { invoice_number: 'desc' },
    });
    let next = 1;
    if (lastInvoice) {
      next = parseInt(lastInvoice.invoice_number.replace(prefix, ''), 10) + 1;
    }
    return `${prefix}${next.toString().padStart(4, '0')}`;
  }

  /**
   * Creates sale invoice and its line items within the given transaction.
   */
  async create(
    dto: CreateSaleInvoiceDto,
    adminId: number,
    totals: InvoiceTotals,
    resolvedItems: ResolvedLineItem[],
    tx: SaleInvoiceTx,
  ): Promise<SaleInvoice> {
    const invoiceNumber = await this.generateInvoiceNumber(tx);

    const invoice = await tx.saleInvoice.create({
      data: {
        invoice_number: invoiceNumber,
        customer_id: dto.customer_id,
        admin_id: adminId,
        invoice_date: totals.invoiceDate,
        due_date: totals.dueDate,
        subtotal: new Decimal(totals.subtotal),
        tax: new Decimal(totals.tax),
        discount: new Decimal(totals.discount),
        total_amount: new Decimal(totals.totalAmount),
        received_amount: new Decimal(totals.receivedAmount),
        payment_status: totals.paymentStatus,
        notes: dto.notes?.trim() ?? null,
      },
    });

    for (const line of resolvedItems) {
      await tx.saleInvoiceItem.create({
        data: {
          sale_invoice_id: invoice.id,
          item_id: line.item_id,
          item_name: line.item_name,
          serial_number: line.serial_number,
          quantity: new Decimal(line.quantity),
          unit_price: new Decimal(line.unit_price),
          cost_price: new Decimal(line.cost_price),
          total_price: new Decimal(line.total_price),
          profit: new Decimal(line.profit),
          production_item_id: line.production_item_id,
        },
      });
    }

    return invoice;
  }
}
