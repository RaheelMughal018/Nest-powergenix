import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, LedgerEntityType, TransactionType } from '@prisma/client';
import { PrismaService } from '../common/database/prisma.service';
import { PaginatedResponseDto } from '../common/dto/pagination-response.dto';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { PaymentFilterDto } from './dto/payment-filter.dto';
import { PaymentResponseDto } from './dto/payment-response.dto';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class PaymentService {
  constructor(private prisma: PrismaService) {}

  /**
   * Generate unique payment number
   * Format: PAY-YYYY-NNNN (e.g., PAY-2026-0001)
   */
  private async generatePaymentNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `PAY-${year}-`;

    // Get the last payment for this year
    const lastPayment = await this.prisma.payment.findFirst({
      where: {
        payment_number: {
          startsWith: prefix,
        },
      },
      orderBy: {
        payment_number: 'desc',
      },
    });

    let nextNumber = 1;
    if (lastPayment) {
      const lastNumber = parseInt(
        lastPayment.payment_number.replace(prefix, ''),
      );
      nextNumber = lastNumber + 1;
    }

    return `${prefix}${nextNumber.toString().padStart(4, '0')}`;
  }

  /**
   * Create a direct payment to supplier (not linked to invoice)
   */
  async create(
    dto: CreatePaymentDto,
    adminId: number,
  ): Promise<PaymentResponseDto> {
    // Verify supplier exists
    const supplier = await this.prisma.supplier.findUnique({
      where: { id: dto.supplier_id },
    });
    if (!supplier) {
      throw new NotFoundException('Supplier not found');
    }

    // Verify account exists
    const account = await this.prisma.account.findUnique({
      where: { id: dto.account_id },
    });
    if (!account) {
      throw new NotFoundException('Account not found');
    }

    // Validate payment amount
    if (dto.amount <= 0) {
      throw new BadRequestException('Payment amount must be greater than 0');
    }

    // Check if supplier has outstanding balance
    if (supplier.current_balance.isZero()) {
      throw new BadRequestException(
        'Supplier has no outstanding balance to pay',
      );
    }

    // Check if payment amount exceeds outstanding balance
    if (new Decimal(dto.amount).gt(supplier.current_balance)) {
      throw new BadRequestException(
        `Payment amount (${dto.amount}) exceeds supplier outstanding balance (${supplier.current_balance.toString()})`,
      );
    }

    // Generate payment number
    const paymentNumber = await this.generatePaymentNumber();

    // Start transaction
    const result = await this.prisma.$transaction(async (tx) => {
      // 1. Decrease supplier balance (payment reduces debt)
      const updatedSupplier = await tx.supplier.update({
        where: { id: dto.supplier_id },
        data: {
          current_balance: {
            decrement: new Decimal(dto.amount),
          },
        },
      });

      // 2. Decrease account balance (money out)
      const updatedAccount = await tx.account.update({
        where: { id: dto.account_id },
        data: {
          current_balance: {
            decrement: new Decimal(dto.amount),
          },
        },
      });

      // 3. Create payment record (NO invoice link)
      const payment = await tx.payment.create({
        data: {
          payment_number: paymentNumber,
          supplier_id: dto.supplier_id,
          account_id: dto.account_id,
          admin_id: adminId,
          amount: new Decimal(dto.amount),
          payment_date: dto.payment_date ? new Date(dto.payment_date) : new Date(),
          purchase_invoice_id: null, // Direct payment - not linked to invoice
          notes: dto.notes || 'Direct payment to supplier',
        },
      });

      // 4. Create supplier ledger entry (DEBIT - reduces balance)
      await tx.ledgerEntry.create({
        data: {
          entity_type: LedgerEntityType.SUPPLIER,
          supplier_id: dto.supplier_id,
          transaction_type: TransactionType.DEBIT,
          amount: new Decimal(dto.amount),
          balance: updatedSupplier.current_balance,
          description: `Direct Payment #${paymentNumber}`,
          reference_number: paymentNumber,
          transaction_date: payment.payment_date,
          payment_id: payment.id,
        },
      });

      // 5. Create account ledger entry (DEBIT - money out)
      await tx.ledgerEntry.create({
        data: {
          entity_type: LedgerEntityType.ACCOUNT,
          account_id: dto.account_id,
          transaction_type: TransactionType.DEBIT,
          amount: new Decimal(dto.amount),
          balance: updatedAccount.current_balance,
          description: `Direct Payment #${paymentNumber} to ${supplier.name}`,
          reference_number: paymentNumber,
          transaction_date: payment.payment_date,
          payment_id: payment.id,
        },
      });

      return payment;
    });

    // Fetch complete payment data
    return this.findOne(result.id);
  }

  /**
   * Get paginated list of payments with filters
   */
  async findAll(
    filter: PaymentFilterDto,
  ): Promise<PaginatedResponseDto<PaymentResponseDto>> {
    const { page = 1, limit = 10, search, sortBy = 'created_at', sortOrder = 'desc' } = filter;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: Prisma.PaymentWhereInput = {};

    if (filter.supplier_id) {
      where.supplier_id = filter.supplier_id;
    }

    if (filter.account_id) {
      where.account_id = filter.account_id;
    }

    if (filter.direct_only) {
      where.purchase_invoice_id = null; // Only direct payments
    }

    if (filter.from_date || filter.to_date) {
      where.payment_date = {};
      if (filter.from_date) {
        where.payment_date.gte = new Date(filter.from_date);
      }
      if (filter.to_date) {
        where.payment_date.lte = new Date(filter.to_date);
      }
    }

    if (search) {
      where.OR = [
        { payment_number: { contains: search, mode: 'insensitive' } },
        { supplier: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    // Get total count
    const totalItems = await this.prisma.payment.count({ where });

    // Get payments
    const payments = await this.prisma.payment.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      include: {
        supplier: {
          select: { name: true },
        },
        account: {
          select: { name: true },
        },
        admin: {
          select: { name: true },
        },
        purchase_invoice: {
          select: { invoice_number: true },
        },
      },
    });

    // Map to response DTOs
    const data = payments.map((payment) => ({
      id: payment.id,
      payment_number: payment.payment_number,
      supplier_id: payment.supplier_id,
      supplier_name: payment.supplier.name,
      account_id: payment.account_id,
      account_name: payment.account.name,
      admin_id: payment.admin_id,
      admin_name: payment.admin.name,
      amount: payment.amount.toFixed(2),
      payment_date: payment.payment_date,
      purchase_invoice_id: payment.purchase_invoice_id ?? undefined,
      invoice_number: payment.purchase_invoice?.invoice_number,
      notes: payment.notes ?? undefined,
      created_at: payment.created_at,
      updated_at: payment.updated_at,
    }));

    return new PaginatedResponseDto(data, totalItems, page, limit);
  }

  /**
   * Get single payment by ID
   */
  async findOne(id: number): Promise<PaymentResponseDto> {
    const payment = await this.prisma.payment.findUnique({
      where: { id },
      include: {
        supplier: {
          select: { name: true },
        },
        account: {
          select: { name: true },
        },
        admin: {
          select: { name: true },
        },
        purchase_invoice: {
          select: { invoice_number: true },
        },
      },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    return {
      id: payment.id,
      payment_number: payment.payment_number,
      supplier_id: payment.supplier_id,
      supplier_name: payment.supplier.name,
      account_id: payment.account_id,
      account_name: payment.account.name,
      admin_id: payment.admin_id,
      admin_name: payment.admin.name,
      amount: payment.amount.toFixed(2),
      payment_date: payment.payment_date,
      purchase_invoice_id: payment.purchase_invoice_id ?? undefined,
      invoice_number: payment.purchase_invoice?.invoice_number,
      notes: payment.notes ?? undefined,
      created_at: payment.created_at,
      updated_at: payment.updated_at,
    };
  }

  /**
   * Delete a direct payment (only if not linked to invoice)
   */
  async remove(id: number): Promise<{ message: string }> {
    const payment = await this.prisma.payment.findUnique({
      where: { id },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    // Cannot delete invoice payments
    if (payment.purchase_invoice_id) {
      throw new BadRequestException(
        'Cannot delete payment linked to invoice. Delete or update the invoice instead.',
      );
    }

    // Start transaction
    await this.prisma.$transaction(async (tx) => {
      // Reverse supplier balance
      await tx.supplier.update({
        where: { id: payment.supplier_id },
        data: {
          current_balance: {
            increment: payment.amount,
          },
        },
      });

      // Reverse account balance
      await tx.account.update({
        where: { id: payment.account_id },
        data: {
          current_balance: {
            increment: payment.amount,
          },
        },
      });

      // Delete ledger entries
      await tx.ledgerEntry.deleteMany({
        where: { payment_id: id },
      });

      // Delete payment
      await tx.payment.delete({
        where: { id },
      });
    });

    return { message: 'Payment deleted successfully' };
  }
}
