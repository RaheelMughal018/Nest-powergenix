import { Injectable } from '@nestjs/common';
import { LedgerEntityType, TransactionType } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { PrismaService } from '../../common/database/prisma.service';
import { InvoiceTotals, SaleInvoiceTx } from './types';
import { SaleInvoice } from '@prisma/client';

@Injectable()
export class SaleInvoiceAccountingProvider {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Updates customer balance (increases debt by totalAmount - receivedAmount) and creates
   * the credit ledger entry for the sale invoice.
   */
  async handleCustomerDebt(
    customerId: number,
    totals: InvoiceTotals,
    invoice: SaleInvoice,
    tx: SaleInvoiceTx,
  ): Promise<void> {
    const debtIncrease = totals.totalAmount - totals.receivedAmount;
    const updatedCustomer = await tx.customer.update({
      where: { id: customerId },
      data: {
        current_balance: { increment: new Decimal(debtIncrease) },
      },
    });

    await tx.ledgerEntry.create({
      data: {
        entity_type: LedgerEntityType.CUSTOMER,
        customer_id: customerId,
        transaction_type: TransactionType.CREDIT,
        amount: new Decimal(totals.totalAmount),
        balance: updatedCustomer.current_balance,
        description: `Sale Invoice #${invoice.invoice_number}`,
        reference_number: invoice.invoice_number,
        transaction_date: totals.invoiceDate,
        sale_invoice_id: invoice.id,
      },
    });
  }
}
