import { Injectable } from '@nestjs/common';
import { LedgerEntityType, TransactionType } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { PrismaService } from '../../common/database/prisma.service';
import { CreateSaleInvoiceDto } from '../dto/create-sale-invoice.dto';
import { InvoiceTotals, SaleInvoiceTx } from './types';
import { SaleInvoice } from '@prisma/client';

@Injectable()
export class SaleInvoicePaymentProvider {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Creates receipt for the payment, updates customer and account balances,
   * and creates ledger entries (customer debit, account credit).
   */
  async handlePayment(
    dto: CreateSaleInvoiceDto,
    invoice: SaleInvoice,
    totals: InvoiceTotals,
    adminId: number,
    tx: SaleInvoiceTx,
  ): Promise<void> {
    if (!dto.account_id || totals.receivedAmount <= 0) return;

    const receiptNumber = await this.generateReceiptNumber(tx);
    const receipt = await tx.receipt.create({
      data: {
        receipt_number: receiptNumber,
        customer_id: dto.customer_id,
        account_id: dto.account_id,
        admin_id: adminId,
        amount: new Decimal(totals.receivedAmount),
        receipt_date: totals.invoiceDate,
        sale_invoice_id: invoice.id,
        notes: `Payment for Sale Invoice #${invoice.invoice_number}`,
      },
    });

    const customerAfterPayment = await tx.customer.update({
      where: { id: dto.customer_id },
      data: {
        current_balance: { decrement: new Decimal(totals.receivedAmount) },
      },
    });
    await tx.ledgerEntry.create({
      data: {
        entity_type: LedgerEntityType.CUSTOMER,
        customer_id: dto.customer_id,
        transaction_type: TransactionType.DEBIT,
        amount: new Decimal(totals.receivedAmount),
        balance: customerAfterPayment.current_balance,
        description: `Receipt #${receiptNumber} for Invoice #${invoice.invoice_number}`,
        reference_number: receiptNumber,
        transaction_date: totals.invoiceDate,
        receipt_id: receipt.id,
        sale_invoice_id: invoice.id,
      },
    });

    const updatedAccount = await tx.account.update({
      where: { id: dto.account_id },
      data: {
        current_balance: { increment: new Decimal(totals.receivedAmount) },
      },
    });
    await tx.ledgerEntry.create({
      data: {
        entity_type: LedgerEntityType.ACCOUNT,
        account_id: dto.account_id,
        transaction_type: TransactionType.CREDIT,
        amount: new Decimal(totals.receivedAmount),
        balance: updatedAccount.current_balance,
        description: `Receipt #${receiptNumber} - Sale Invoice #${invoice.invoice_number}`,
        reference_number: receiptNumber,
        transaction_date: totals.invoiceDate,
        receipt_id: receipt.id,
      },
    });
  }

  private async generateReceiptNumber(tx: SaleInvoiceTx): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `REC-${year}-`;
    const last = await tx.receipt.findFirst({
      where: { receipt_number: { startsWith: prefix } },
      orderBy: { receipt_number: 'desc' },
    });
    let next = 1;
    if (last) {
      next = parseInt(last.receipt_number.replace(prefix, ''), 10) + 1;
    }
    return `${prefix}${next.toString().padStart(4, '0')}`;
  }
}
