import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { LedgerEntityType, PaymentStatus, Prisma, TransactionType } from '@prisma/client';
import { PrismaService } from '../common/database/prisma.service';
import { PaginatedResponseDto } from '../common/dto/pagination-response.dto';
import {
  CreatePurchaseInvoiceDto,
  PurchaseInvoiceItemDto,
} from './dto/create-purchase-invoice.dto';
import { UpdatePurchaseInvoiceDto } from './dto/update-purchase-invoice.dto';
import { PurchaseInvoiceFilterDto } from './dto/purchase-invoice-filter.dto';
import {
  PurchaseInvoiceResponseDto,
  PurchaseInvoiceItemResponseDto,
} from './dto/purchase-invoice-response.dto';
import { PurchaseInvoiceSummaryDto } from './dto/purchase-invoice-summary.dto';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class PurchaseInvoiceService {
  constructor(private prisma: PrismaService) {}

  /**
   * Generate unique invoice number
   * Format: PI-YYYY-NNNN (e.g., PI-2026-0001)
   */
  private async generateInvoiceNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `PI-${year}-`;

    // Get the last invoice for this year
    const lastInvoice = await this.prisma.purchaseInvoice.findFirst({
      where: {
        invoice_number: {
          startsWith: prefix,
        },
      },
      orderBy: {
        invoice_number: 'desc',
      },
    });

    let nextNumber = 1;
    if (lastInvoice) {
      const lastNumber = parseInt(
        lastInvoice.invoice_number.replace(prefix, ''),
      );
      nextNumber = lastNumber + 1;
    }

    return `${prefix}${nextNumber.toString().padStart(4, '0')}`;
  }

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
      const lastNumber = parseInt(lastPayment.payment_number.replace(prefix, ''));
      nextNumber = lastNumber + 1;
    }

    return `${prefix}${nextNumber.toString().padStart(4, '0')}`;
  }

  /**
   * Calculate weighted average price
   */
  private calculateWeightedAverage(
    oldQuantity: Decimal,
    oldAvgPrice: Decimal,
    newQuantity: Decimal,
    newUnitPrice: Decimal,
  ): Decimal {
    const oldTotal = new Decimal(oldQuantity).mul(oldAvgPrice);
    const newTotal = new Decimal(newQuantity).mul(newUnitPrice);
    const totalQuantity = new Decimal(oldQuantity).add(newQuantity);

    if (totalQuantity.isZero()) {
      return new Decimal(0);
    }

    return oldTotal.add(newTotal).div(totalQuantity);
  }

  /**
   * Create a new purchase invoice with all related entities
   */
  async create(
    dto: CreatePurchaseInvoiceDto,
    adminId: number,
  ): Promise<PurchaseInvoiceResponseDto> {
    // Validate items array
    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException('At least one item is required');
    }

    // Validate payment status and required fields
    if (
      (dto.payment_status === PaymentStatus.PAID ||
        dto.payment_status === PaymentStatus.PARTIAL) &&
      (!dto.account_id || dto.paid_amount === undefined)
    ) {
      throw new BadRequestException(
        'account_id and paid_amount are required for PAID or PARTIAL status',
      );
    }

    if (dto.payment_status === PaymentStatus.UNPAID && dto.paid_amount) {
      throw new BadRequestException(
        'paid_amount must be 0 or undefined for UNPAID status',
      );
    }

    // Verify supplier exists
    const supplier = await this.prisma.supplier.findUnique({
      where: { id: dto.supplier_id },
    });
    if (!supplier) {
      throw new NotFoundException('Supplier not found');
    }

    // Verify account exists if payment is being made
    if (dto.account_id) {
      const account = await this.prisma.account.findUnique({
        where: { id: dto.account_id },
      });
      if (!account) {
        throw new NotFoundException('Account not found');
      }
    }

    // Verify all items exist
    const itemIds = dto.items.map((item) => item.item_id);
    const items = await this.prisma.item.findMany({
      where: { id: { in: itemIds } },
    });

    if (items.length !== itemIds.length) {
      throw new NotFoundException('One or more items not found');
    }

    // Calculate totals
    const subtotal = dto.items.reduce(
      (sum, item) => sum + item.quantity * item.unit_price,
      0,
    );
    const tax = dto.tax || 0;
    const discount = dto.discount || 0;
    const totalAmount = subtotal + tax - discount;

    // Validate paid amount
    const paidAmount = dto.paid_amount || 0;
    if (dto.payment_status === PaymentStatus.PAID && paidAmount !== totalAmount) {
      throw new BadRequestException(
        'paid_amount must equal total_amount for PAID status',
      );
    }
    if (
      dto.payment_status === PaymentStatus.PARTIAL &&
      (paidAmount <= 0 || paidAmount >= totalAmount)
    ) {
      throw new BadRequestException(
        'paid_amount must be greater than 0 and less than total_amount for PARTIAL status',
      );
    }

    // Generate invoice number
    const invoiceNumber = await this.generateInvoiceNumber();

    // Start transaction - All or nothing
    const result = await this.prisma.$transaction(async (tx) => {
      // 1. Create invoice
      const invoice = await tx.purchaseInvoice.create({
        data: {
          invoice_number: invoiceNumber,
          supplier_id: dto.supplier_id,
          admin_id: adminId,
          invoice_date: dto.invoice_date ? new Date(dto.invoice_date) : new Date(),
          due_date: dto.due_date ? new Date(dto.due_date) : null,
          subtotal: new Decimal(subtotal),
          tax: new Decimal(tax),
          discount: new Decimal(discount),
          total_amount: new Decimal(totalAmount),
          paid_amount: new Decimal(paidAmount),
          payment_status: dto.payment_status,
          notes: dto.notes,
        },
      });

      // 2. Create invoice items and update stock
      for (const itemDto of dto.items) {
        const item = items.find((i) => i.id === itemDto.item_id);
        if (!item) continue;

        // Create invoice item
        const totalPrice = itemDto.quantity * itemDto.unit_price;
        await tx.purchaseInvoiceItem.create({
          data: {
            purchase_invoice_id: invoice.id,
            item_id: itemDto.item_id,
            quantity: new Decimal(itemDto.quantity),
            unit_price: new Decimal(itemDto.unit_price),
            total_price: new Decimal(totalPrice),
          },
        });

        // Calculate new weighted average price
        const newAvgPrice = this.calculateWeightedAverage(
          item.quantity,
          item.avg_price,
          new Decimal(itemDto.quantity),
          new Decimal(itemDto.unit_price),
        );

        // Update item stock and average price
        await tx.item.update({
          where: { id: itemDto.item_id },
          data: {
            quantity: item.quantity.add(itemDto.quantity),
            avg_price: newAvgPrice,
          },
        });

        // Create stock adjustment record
        await tx.stockAdjustment.create({
          data: {
            item_id: itemDto.item_id,
            admin_id: adminId,
            quantity: new Decimal(itemDto.quantity),
            avg_price: new Decimal(itemDto.unit_price),
            reason: `Purchase Invoice #${invoiceNumber}`,
            purchase_invoice_id: invoice.id,
          },
        });
      }

      // 3. Update supplier balance and create ledger entry for invoice
      // First, increase supplier balance by total_amount (the invoice creates debt)
      let updatedSupplier = await tx.supplier.update({
        where: { id: dto.supplier_id },
        data: {
          current_balance: {
            increment: new Decimal(totalAmount),
          },
        },
      });

      // Create supplier ledger entry (CREDIT for invoice)
      await tx.ledgerEntry.create({
        data: {
          entity_type: LedgerEntityType.SUPPLIER,
          supplier_id: dto.supplier_id,
          transaction_type: TransactionType.CREDIT,
          amount: new Decimal(totalAmount),
          balance: updatedSupplier.current_balance,
          description: `Purchase Invoice #${invoiceNumber}`,
          reference_number: invoiceNumber,
          transaction_date: invoice.invoice_date,
          purchase_invoice_id: invoice.id,
        },
      });

      // 4. Handle payment if made (PAID or PARTIAL)
      if (paidAmount > 0 && dto.account_id) {
        // Generate payment number
        const paymentNumber = await this.generatePaymentNumber();

        // Decrease supplier balance by paid_amount (payment reduces debt)
        updatedSupplier = await tx.supplier.update({
          where: { id: dto.supplier_id },
          data: {
            current_balance: {
              decrement: new Decimal(paidAmount),
            },
          },
        });

        // Create supplier ledger entry (DEBIT for payment)
        await tx.ledgerEntry.create({
          data: {
            entity_type: LedgerEntityType.SUPPLIER,
            supplier_id: dto.supplier_id,
            transaction_type: TransactionType.DEBIT,
            amount: new Decimal(paidAmount),
            balance: updatedSupplier.current_balance,
            description: `Payment for Invoice #${invoiceNumber}`,
            reference_number: paymentNumber,
            transaction_date: invoice.invoice_date,
            purchase_invoice_id: invoice.id,
          },
        });

        // Update account balance
        const updatedAccount = await tx.account.update({
          where: { id: dto.account_id },
          data: {
            current_balance: {
              decrement: new Decimal(paidAmount),
            },
          },
        });

        // Create payment record
        const payment = await tx.payment.create({
          data: {
            payment_number: paymentNumber,
            supplier_id: dto.supplier_id,
            account_id: dto.account_id,
            admin_id: adminId,
            amount: new Decimal(paidAmount),
            payment_date: invoice.invoice_date,
            purchase_invoice_id: invoice.id,
            notes: `Payment for Invoice #${invoiceNumber}`,
          },
        });

        // Create account ledger entry (DEBIT)
        await tx.ledgerEntry.create({
          data: {
            entity_type: LedgerEntityType.ACCOUNT,
            account_id: dto.account_id,
            transaction_type: TransactionType.DEBIT,
            amount: new Decimal(paidAmount),
            balance: updatedAccount.current_balance,
            description: `Payment for Invoice #${invoiceNumber}`,
            reference_number: paymentNumber,
            transaction_date: invoice.invoice_date,
            payment_id: payment.id,
          },
        });
      }

      return invoice;
    });

    // Fetch complete invoice data
    return this.findOne(result.id);
  }

  /**
   * Get paginated list of invoices with filters
   */
  async findAll(
    filter: PurchaseInvoiceFilterDto,
  ): Promise<PaginatedResponseDto<PurchaseInvoiceResponseDto>> {
    const { page = 1, limit = 10, search, sortBy = 'created_at', sortOrder = 'desc' } = filter;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: Prisma.PurchaseInvoiceWhereInput = {};

    if (filter.supplier_id) {
      where.supplier_id = filter.supplier_id;
    }

    if (filter.payment_status) {
      where.payment_status = filter.payment_status;
    }

    if (filter.from_date || filter.to_date) {
      where.invoice_date = {};
      if (filter.from_date) {
        where.invoice_date.gte = new Date(filter.from_date);
      }
      if (filter.to_date) {
        where.invoice_date.lte = new Date(filter.to_date);
      }
    }

    if (search) {
      where.OR = [
        { invoice_number: { contains: search, mode: 'insensitive' } },
        { supplier: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    // Get total count
    const totalItems = await this.prisma.purchaseInvoice.count({ where });

    // Get invoices
    const invoices = await this.prisma.purchaseInvoice.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      include: {
        supplier: {
          select: { name: true },
        },
        admin: {
          select: { name: true },
        },
        items: {
          include: {
            item: {
              select: { name: true },
            },
          },
        },
      },
    });

    // Map to response DTOs
    const data = invoices.map((invoice) => ({
      id: invoice.id,
      invoice_number: invoice.invoice_number,
      supplier_id: invoice.supplier_id,
      supplier_name: invoice.supplier.name,
      admin_id: invoice.admin_id,
      admin_name: invoice.admin.name,
      invoice_date: invoice.invoice_date,
      due_date: invoice.due_date ?? undefined,
      subtotal: invoice.subtotal,
      tax: invoice.tax,
      discount: invoice.discount,
      total_amount: invoice.total_amount,
      paid_amount: invoice.paid_amount,
      payment_status: invoice.payment_status,
      notes: invoice.notes ?? undefined,
      created_at: invoice.created_at,
      updated_at: invoice.updated_at,
      outstanding_amount: new Decimal(invoice.total_amount).sub(invoice.paid_amount),
    }));

    return new PaginatedResponseDto(data, totalItems, page, limit);
  }

  /**
   * Get single invoice by ID
   */
  async findOne(id: number): Promise<PurchaseInvoiceResponseDto> {
    const invoice = await this.prisma.purchaseInvoice.findUnique({
      where: { id },
      include: {
        supplier: {
          select: { name: true },
        },
        admin: {
          select: { name: true },
        },
        items: {
          include: {
            item: {
              select: { name: true },
            },
          },
        },
      },
    });

    if (!invoice) {
      throw new NotFoundException('Purchase invoice not found');
    }

    return {
      id: invoice.id,
      invoice_number: invoice.invoice_number,
      supplier_id: invoice.supplier_id,
      supplier_name: invoice.supplier.name,
      admin_id: invoice.admin_id,
      admin_name: invoice.admin.name,
      invoice_date: invoice.invoice_date,
      due_date: invoice.due_date ?? undefined,
      subtotal: invoice.subtotal,
      tax: invoice.tax,
      discount: invoice.discount,
      total_amount: invoice.total_amount,
      paid_amount: invoice.paid_amount,
      payment_status: invoice.payment_status,
      notes: invoice.notes ?? undefined,
      created_at: invoice.created_at,
      updated_at: invoice.updated_at,
      items: invoice.items.map((item) => ({
        id: item.id,
        item_id: item.item_id,
        item_name: item.item.name,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.total_price,
        created_at: item.created_at,
      })),
      outstanding_amount: new Decimal(invoice.total_amount).sub(invoice.paid_amount),
    };
  }

  /**
   * Update invoice (only if UNPAID and no payments made)
   */
  async update(
    id: number,
    dto: UpdatePurchaseInvoiceDto,
    adminId: number,
  ): Promise<PurchaseInvoiceResponseDto> {
    // Get existing invoice
    const existingInvoice = await this.prisma.purchaseInvoice.findUnique({
      where: { id },
      include: {
        payments: true,
        items: true,
      },
    });

    if (!existingInvoice) {
      throw new NotFoundException('Purchase invoice not found');
    }

    // Validate update restrictions
    if (existingInvoice.payment_status !== PaymentStatus.UNPAID) {
      throw new ConflictException(
        'Cannot update invoice that is not UNPAID',
      );
    }

    if (existingInvoice.payments.length > 0) {
      throw new ConflictException(
        'Cannot update invoice that has payments',
      );
    }

    // Start transaction
    await this.prisma.$transaction(async (tx) => {
      // If items are being updated, reverse old stock and apply new stock
      if (dto.items) {
        // Reverse old stock adjustments
        for (const oldItem of existingInvoice.items) {
          const item = await tx.item.findUnique({
            where: { id: oldItem.item_id },
          });

          if (!item) continue;

          // Reverse quantity
          await tx.item.update({
            where: { id: oldItem.item_id },
            data: {
              quantity: item.quantity.sub(oldItem.quantity),
            },
          });

          // Delete old stock adjustment
          await tx.stockAdjustment.deleteMany({
            where: {
              purchase_invoice_id: id,
              item_id: oldItem.item_id,
            },
          });
        }

        // Delete old invoice items
        await tx.purchaseInvoiceItem.deleteMany({
          where: { purchase_invoice_id: id },
        });

        // Verify all new items exist
        const itemIds = dto.items.map((item) => item.item_id);
        const items = await tx.item.findMany({
          where: { id: { in: itemIds } },
        });

        if (items.length !== itemIds.length) {
          throw new NotFoundException('One or more items not found');
        }

        // Add new items and stock
        for (const itemDto of dto.items) {
          const item = items.find((i) => i.id === itemDto.item_id);
          if (!item) continue;

          // Create invoice item
          const totalPrice = itemDto.quantity * itemDto.unit_price;
          await tx.purchaseInvoiceItem.create({
            data: {
              purchase_invoice_id: id,
              item_id: itemDto.item_id,
              quantity: new Decimal(itemDto.quantity),
              unit_price: new Decimal(itemDto.unit_price),
              total_price: new Decimal(totalPrice),
            },
          });

          // Calculate new weighted average price
          const newAvgPrice = this.calculateWeightedAverage(
            item.quantity,
            item.avg_price,
            new Decimal(itemDto.quantity),
            new Decimal(itemDto.unit_price),
          );

          // Update item stock and average price
          await tx.item.update({
            where: { id: itemDto.item_id },
            data: {
              quantity: item.quantity.add(itemDto.quantity),
              avg_price: newAvgPrice,
            },
          });

          // Create stock adjustment record
          await tx.stockAdjustment.create({
            data: {
              item_id: itemDto.item_id,
              admin_id: adminId,
              quantity: new Decimal(itemDto.quantity),
              avg_price: new Decimal(itemDto.unit_price),
              reason: `Purchase Invoice #${existingInvoice.invoice_number} (Updated)`,
              purchase_invoice_id: id,
            },
          });
        }
      }

      // Calculate new totals if items changed
      let updateData: Prisma.PurchaseInvoiceUpdateInput = {};

      if (dto.items) {
        const subtotal = dto.items.reduce(
          (sum, item) => sum + item.quantity * item.unit_price,
          0,
        );
        const tax = dto.tax !== undefined ? dto.tax : existingInvoice.tax.toNumber();
        const discount = dto.discount !== undefined ? dto.discount : existingInvoice.discount.toNumber();
        const totalAmount = subtotal + tax - discount;

        updateData = {
          ...updateData,
          subtotal: new Decimal(subtotal),
          tax: new Decimal(tax),
          discount: new Decimal(discount),
          total_amount: new Decimal(totalAmount),
        };

        // Update supplier balance with the difference
        const oldTotal = existingInvoice.total_amount.toNumber();
        const difference = totalAmount - oldTotal;

        if (difference !== 0) {
          const updatedSupplier = await tx.supplier.update({
            where: { id: existingInvoice.supplier_id },
            data: {
              current_balance: {
                increment: new Decimal(difference),
              },
            },
          });

          // Update ledger entry
          await tx.ledgerEntry.updateMany({
            where: {
              purchase_invoice_id: id,
              entity_type: LedgerEntityType.SUPPLIER,
            },
            data: {
              amount: new Decimal(totalAmount),
              balance: updatedSupplier.current_balance,
            },
          });
        }
      } else {
        // Just update tax/discount if provided
        if (dto.tax !== undefined) {
          updateData.tax = new Decimal(dto.tax);
        }
        if (dto.discount !== undefined) {
          updateData.discount = new Decimal(dto.discount);
        }

        // Recalculate total if tax or discount changed
        if (dto.tax !== undefined || dto.discount !== undefined) {
          const subtotal = existingInvoice.subtotal.toNumber();
          const tax = dto.tax !== undefined ? dto.tax : existingInvoice.tax.toNumber();
          const discount = dto.discount !== undefined ? dto.discount : existingInvoice.discount.toNumber();
          const totalAmount = subtotal + tax - discount;

          updateData.total_amount = new Decimal(totalAmount);

          // Update supplier balance with the difference
          const oldTotal = existingInvoice.total_amount.toNumber();
          const difference = totalAmount - oldTotal;

          if (difference !== 0) {
            const updatedSupplier = await tx.supplier.update({
              where: { id: existingInvoice.supplier_id },
              data: {
                current_balance: {
                  increment: new Decimal(difference),
                },
              },
            });

            // Update ledger entry
            await tx.ledgerEntry.updateMany({
              where: {
                purchase_invoice_id: id,
                entity_type: LedgerEntityType.SUPPLIER,
              },
              data: {
                amount: new Decimal(totalAmount),
                balance: updatedSupplier.current_balance,
              },
            });
          }
        }
      }

      if (dto.invoice_date) {
        updateData.invoice_date = new Date(dto.invoice_date);
      }
      if (dto.due_date !== undefined) {
        updateData.due_date = dto.due_date ? new Date(dto.due_date) : null;
      }
      if (dto.notes !== undefined) {
        updateData.notes = dto.notes;
      }

      // Update invoice
      await tx.purchaseInvoice.update({
        where: { id },
        data: updateData,
      });
    });

    return this.findOne(id);
  }

  /**
   * Delete invoice (only if no payments made)
   */
  async remove(id: number): Promise<{ message: string }> {
    // Get existing invoice
    const existingInvoice = await this.prisma.purchaseInvoice.findUnique({
      where: { id },
      include: {
        payments: true,
        items: true,
      },
    });

    if (!existingInvoice) {
      throw new NotFoundException('Purchase invoice not found');
    }

    // Validate delete restrictions
    if (existingInvoice.payments.length > 0) {
      throw new ConflictException(
        'Cannot delete invoice that has payments',
      );
    }

    // Start transaction
    await this.prisma.$transaction(async (tx) => {
      // Reverse stock adjustments
      for (const item of existingInvoice.items) {
        const currentItem = await tx.item.findUnique({
          where: { id: item.item_id },
        });

        if (!currentItem) continue;

        // Reverse quantity
        await tx.item.update({
          where: { id: item.item_id },
          data: {
            quantity: currentItem.quantity.sub(item.quantity),
          },
        });
      }

      // Reverse supplier balance
      await tx.supplier.update({
        where: { id: existingInvoice.supplier_id },
        data: {
          current_balance: {
            decrement: existingInvoice.total_amount,
          },
        },
      });

      // Delete related records (cascade will handle some)
      await tx.stockAdjustment.deleteMany({
        where: { purchase_invoice_id: id },
      });

      await tx.ledgerEntry.deleteMany({
        where: { purchase_invoice_id: id },
      });

      await tx.purchaseInvoiceItem.deleteMany({
        where: { purchase_invoice_id: id },
      });

      // Delete invoice
      await tx.purchaseInvoice.delete({
        where: { id },
      });
    });

    return { message: 'Purchase invoice deleted successfully' };
  }

  /**
   * Get invoice summary statistics
   */
  async getSummary(): Promise<PurchaseInvoiceSummaryDto> {
    const [totalInvoices, paidCount, unpaidCount, partialCount, aggregations] =
      await Promise.all([
        this.prisma.purchaseInvoice.count(),
        this.prisma.purchaseInvoice.count({
          where: { payment_status: PaymentStatus.PAID },
        }),
        this.prisma.purchaseInvoice.count({
          where: { payment_status: PaymentStatus.UNPAID },
        }),
        this.prisma.purchaseInvoice.count({
          where: { payment_status: PaymentStatus.PARTIAL },
        }),
        this.prisma.purchaseInvoice.aggregate({
          _sum: {
            total_amount: true,
            paid_amount: true,
          },
        }),
      ]);

    const totalAmount = aggregations._sum.total_amount || new Decimal(0);
    const paidAmount = aggregations._sum.paid_amount || new Decimal(0);
    const outstandingAmount = new Decimal(totalAmount).sub(paidAmount);

    return {
      total_invoices: totalInvoices,
      total_amount: totalAmount.toFixed(2),
      paid_count: paidCount,
      unpaid_count: unpaidCount,
      partial_count: partialCount,
      outstanding_amount: outstandingAmount.toFixed(2),
      paid_amount: paidAmount.toFixed(2),
    };
  }
}
