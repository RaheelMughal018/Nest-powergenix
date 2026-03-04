import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { LedgerEntityType, TransactionType } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { PaginatedResponseDto } from '../common/dto/pagination-response.dto';
import { PrismaService } from '../common/database/prisma.service';
import { LoggerService } from '../common/logger/logger.service';
import { CreateReceiptDto } from './dto/create-receipt.dto';
import { ReceiptFilterDto } from './dto/receipt-filter.dto';

@Injectable()
export class ReceiptService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: LoggerService,
  ) {
    this.logger.setContext('ReceiptService');
  }

  private async generateReceiptNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `REC-${year}-`;
    const last = await this.prisma.receipt.findFirst({
      where: { receipt_number: { startsWith: prefix } },
      orderBy: { receipt_number: 'desc' },
    });
    let next = 1;
    if (last) {
      next = parseInt(last.receipt_number.replace(prefix, ''), 10) + 1;
    }
    return `${prefix}${next.toString().padStart(4, '0')}`;
  }

  /**
   * Create a direct receipt (no invoice). Reduces customer balance, increases account, creates ledger entries.
   * For invoice-linked receipts use sale invoice with PAID/PARTIAL.
   */
  async create(dto: CreateReceiptDto, adminId: number) {
    const customer = await this.prisma.customer.findUnique({
      where: { id: dto.customer_id },
    });
    if (!customer) {
      throw new NotFoundException('Customer not found');
    }
    const account = await this.prisma.account.findUnique({
      where: { id: dto.account_id },
    });
    if (!account) {
      throw new NotFoundException('Account not found');
    }
    const amount = new Decimal(dto.amount);
    if (amount.lte(0)) {
      throw new BadRequestException('Amount must be greater than 0');
    }

    const receiptDate = dto.receipt_date ? new Date(dto.receipt_date) : new Date();
    const receiptNumber = await this.generateReceiptNumber();

    const result = await this.prisma.$transaction(async (tx) => {
      const receipt = await tx.receipt.create({
        data: {
          receipt_number: receiptNumber,
          customer_id: dto.customer_id,
          account_id: dto.account_id,
          admin_id: adminId,
          amount,
          receipt_date: receiptDate,
          sale_invoice_id: null,
          notes: dto.notes?.trim() ?? null,
        },
      });

      const updatedCustomer = await tx.customer.update({
        where: { id: dto.customer_id },
        data: { current_balance: { decrement: amount } },
      });
      await tx.ledgerEntry.create({
        data: {
          entity_type: LedgerEntityType.CUSTOMER,
          customer_id: dto.customer_id,
          transaction_type: TransactionType.DEBIT,
          amount,
          balance: updatedCustomer.current_balance,
          description: `Direct Receipt #${receiptNumber}`,
          reference_number: receiptNumber,
          transaction_date: receiptDate,
          receipt_id: receipt.id,
        },
      });

      const updatedAccount = await tx.account.update({
        where: { id: dto.account_id },
        data: { current_balance: { increment: amount } },
      });
      await tx.ledgerEntry.create({
        data: {
          entity_type: LedgerEntityType.ACCOUNT,
          account_id: dto.account_id,
          transaction_type: TransactionType.CREDIT,
          amount,
          balance: updatedAccount.current_balance,
          description: `Direct Receipt #${receiptNumber} - ${customer.name}`,
          reference_number: receiptNumber,
          transaction_date: receiptDate,
          receipt_id: receipt.id,
        },
      });

      return receipt;
    });

    this.logger.log(`Created direct receipt ${receiptNumber}`);
    return this.findOne(result.id);
  }

  async findOne(id: number) {
    const receipt = await this.prisma.receipt.findUnique({
      where: { id },
      include: {
        customer: { select: { id: true, name: true } },
        account: { select: { id: true, name: true } },
        admin: { select: { id: true, name: true } },
      },
    });
    if (!receipt) {
      throw new NotFoundException(`Receipt with ID ${id} not found`);
    }
    return {
      ...receipt,
      customer_name: receipt.customer.name,
      account_name: receipt.account.name,
      admin_name: receipt.admin.name,
    };
  }

  async findAll(filter: ReceiptFilterDto) {
    const page = filter?.page ?? 1;
    const limit = Math.min(Math.max(filter?.limit ?? 10, 1), 100);
    const skip = (page - 1) * limit;
    const where: { customer_id?: number; receipt_date?: { gte?: Date; lte?: Date } } = {};
    if (filter?.customer_id) where.customer_id = filter.customer_id;
    if (filter?.from_date || filter?.to_date) {
      where.receipt_date = {};
      if (filter.from_date) {
        where.receipt_date.gte = new Date(filter.from_date);
      }
      if (filter.to_date) {
        where.receipt_date.lte = new Date(filter.to_date);
      }
    }

    const [receipts, total] = await Promise.all([
      this.prisma.receipt.findMany({
        where,
        skip,
        take: limit,
        orderBy: { id: 'desc' },
        include: {
          customer: { select: { id: true, name: true } },
          account: { select: { id: true, name: true } },
        },
      }),
      this.prisma.receipt.count({ where }),
    ]);

    const items = receipts.map((r) => ({
      ...r,
      customer_name: r.customer.name,
      account_name: r.account.name,
    }));
    return new PaginatedResponseDto(items, total, page, limit);
  }

  /**
   * Delete a receipt. Only allowed for direct receipts (sale_invoice_id is null).
   * Reverses customer balance, account balance, and removes ledger entries.
   */
  async remove(id: number) {
    const receipt = await this.prisma.receipt.findUnique({
      where: { id },
    });
    if (!receipt) {
      throw new NotFoundException(`Receipt with ID ${id} not found`);
    }
    if (receipt.sale_invoice_id != null) {
      throw new BadRequestException(
        'Cannot delete invoice-linked receipt. It was created automatically from a sale invoice.',
      );
    }

    const amount = new Decimal(receipt.amount.toString());

    await this.prisma.$transaction(async (tx) => {
      await tx.customer.update({
        where: { id: receipt.customer_id },
        data: { current_balance: { increment: amount } },
      });
      await tx.account.update({
        where: { id: receipt.account_id },
        data: { current_balance: { decrement: amount } },
      });
      await tx.ledgerEntry.deleteMany({
        where: { receipt_id: id },
      });
      await tx.receipt.delete({
        where: { id },
      });
    });

    this.logger.log(`Deleted direct receipt #${receipt.receipt_number}`);
    return { message: 'Receipt deleted successfully' };
  }
}
