import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import {
  ItemType,
  LedgerEntityType,
  PaymentStatus,
  RepairStatus,
  TransactionType,
} from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { PrismaService } from '../common/database/prisma.service';
import { LoggerService } from '../common/logger/logger.service';
import { CreateRepairInvoiceDto } from './dto/create-repair-invoice.dto';
import { UpdateRepairStatusDto } from './dto/update-repair-status.dto';
import { PaginatedResponseDto } from '../common/dto/pagination-response.dto';

@Injectable()
export class RepairInvoiceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: LoggerService,
  ) {
    this.logger.setContext('RepairInvoiceService');
  }

  private async generateInvoiceNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `RINV-${year}-`;
    const last = await this.prisma.repairInvoice.findFirst({
      where: { invoice_number: { startsWith: prefix } },
      orderBy: { invoice_number: 'desc' },
    });
    const next = last ? parseInt(last.invoice_number.replace(prefix, ''), 10) + 1 : 1;
    return `${prefix}${next.toString().padStart(4, '0')}`;
  }

  async create(dto: CreateRepairInvoiceDto, adminId: number) {
    if (!dto.items?.length) {
      throw new BadRequestException('At least one line item is required');
    }

    const customer = await this.prisma.customer.findUnique({
      where: { id: dto.customer_id },
    });
    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    const isFOC = dto.is_foc === true;
    if (isFOC) {
      if (dto.payment_status || dto.received_amount || dto.account_id) {
        throw new BadRequestException('Payment fields are not allowed for FOC repair');
      }
    } else {
      const isPayment =
        dto.payment_status === PaymentStatus.PAID || dto.payment_status === PaymentStatus.PARTIAL;
      if (isPayment) {
        if (dto.received_amount == null || dto.received_amount < 0) {
          throw new BadRequestException(
            'received_amount is required when payment_status is PAID or PARTIAL',
          );
        }
        if (dto.payment_status === PaymentStatus.PAID && dto.received_amount <= 0) {
          throw new BadRequestException(
            'received_amount must be greater than 0 when payment_status is PAID',
          );
        }
        if (!dto.account_id) {
          throw new BadRequestException(
            'account_id is required when payment_status is PAID or PARTIAL',
          );
        }
        const account = await this.prisma.account.findUnique({
          where: { id: dto.account_id },
        });
        if (!account) {
          throw new NotFoundException('Account not found');
        }
      }
    }

    const receivedDate = dto.received_date ? new Date(dto.received_date) : new Date();

    // If serial_number given, resolve production item and set production_item_id + item_type
    let productionItemId: number | null = dto.production_item_id ?? null;
    let itemType: ItemType | null = dto.item_type ?? null;
    const serialNumberTrimmed = dto.serial_number?.trim();
    if (serialNumberTrimmed) {
      const productionItem = await this.prisma.productionItem.findUnique({
        where: { serial_number: serialNumberTrimmed },
        select: { id: true, item_id: true, item: { select: { item_type: true } } },
      });
      if (!productionItem) {
        throw new NotFoundException(
          `Production item with serial number "${serialNumberTrimmed}" not found`,
        );
      }
      productionItemId = productionItem.id;
      itemType = productionItem.item.item_type;
      if (dto.production_item_id != null && dto.production_item_id !== productionItemId) {
        throw new BadRequestException(
          `Serial "${serialNumberTrimmed}" belongs to production item ID ${productionItem.id}, not ${dto.production_item_id}`,
        );
      }
    }

    const result = await this.prisma.$transaction(async (tx) => {
      let partsCost = new Decimal(0);
      let totalAmountFromLines = new Decimal(0);

      for (const row of dto.items) {
        const qty = new Decimal(row.quantity);
        const unitPrice = new Decimal(row.unit_price);
        const lineTotal = qty.mul(unitPrice);
        const isBush = row.is_bush === true;

        // Bush: add to total but do NOT deduct from stock
        totalAmountFromLines = totalAmountFromLines.add(lineTotal);

        // Only non-bush lines with item_id deduct stock and count toward parts_cost
        if (row.item_id != null && !isBush) {
          const item = await tx.item.findUnique({
            where: { id: row.item_id },
          });
          if (!item) {
            throw new NotFoundException(`Item ${row.item_id} not found`);
          }
          if (item.item_type !== ItemType.RAW) {
            throw new BadRequestException(
              `Item ${row.item_id} is not RAW. Only RAW items can be used as parts.`,
            );
          }
          const requested = new Decimal(row.quantity);
          const available = new Decimal(item.quantity.toString());
          if (available.lt(requested)) {
            throw new BadRequestException(
              `Insufficient stock for item ${row.item_id}: requested ${row.quantity}, available ${item.quantity}`,
            );
          }
          const cost = new Decimal(item.avg_price.toString()).mul(requested);
          partsCost = partsCost.add(cost);
        }
      }

      const totalAmountNum = totalAmountFromLines.toNumber();
      const partsCostNum = partsCost.toNumber();
      const serviceChargesNum = Math.max(0, totalAmountNum - partsCostNum);
      const totalAmount = isFOC ? 0 : totalAmountNum;

      let receivedAmount = 0;
      let paymentStatus: PaymentStatus = PaymentStatus.UNPAID;
      if (!isFOC) {
        paymentStatus = dto.payment_status ?? PaymentStatus.UNPAID;
        if (paymentStatus === PaymentStatus.PAID) {
          receivedAmount = totalAmount;
        } else if (dto.received_amount != null) {
          receivedAmount = dto.received_amount;
        }
        if (receivedAmount > totalAmount) {
          throw new BadRequestException('received_amount cannot exceed total_amount');
        }
      }

      const invoiceNumber = await this.generateInvoiceNumber();

      const repairInvoice = await tx.repairInvoice.create({
        data: {
          invoice_number: invoiceNumber,
          customer_id: dto.customer_id,
          admin_id: adminId,
          item_type: itemType,
          production_item_id: productionItemId,
          serial_number: serialNumberTrimmed || null,
          item_id: productionItemId == null ? (dto.item_id ?? null) : null,
          item_description: dto.item_description?.trim() || null,
          is_foc: isFOC,
          repair_status: RepairStatus.PENDING,
          received_date: receivedDate,
          parts_cost: partsCost,
          service_charges: new Decimal(serviceChargesNum),
          total_amount: new Decimal(totalAmount),
          received_amount: new Decimal(receivedAmount),
          payment_status: paymentStatus,
          notes: dto.notes?.trim() || null,
          technician_notes: dto.technician_notes?.trim() || null,
        },
      });

      for (const row of dto.items) {
        const qty = new Decimal(row.quantity);
        const unitPrice = new Decimal(row.unit_price);
        const totalPrice = qty.mul(unitPrice);
        let costPrice: Decimal | null = null;
        if (row.item_id) {
          const item = await tx.item.findUnique({
            where: { id: row.item_id },
          });
          costPrice = item ? new Decimal(item.avg_price.toString()) : null;
        }
        await tx.repairInvoiceItem.create({
          data: {
            repair_invoice_id: repairInvoice.id,
            item_id: row.item_id ?? null,
            description: row.description,
            quantity: qty,
            unit_price: unitPrice,
            total_price: totalPrice,
            cost_price: costPrice,
            is_bush: row.is_bush === true,
          },
        });
      }

      if (!isFOC && totalAmount > 0) {
        const debtIncrease = totalAmount - receivedAmount;
        const updatedCustomer = await tx.customer.update({
          where: { id: dto.customer_id },
          data: {
            current_balance: { increment: new Decimal(debtIncrease) },
          },
        });
        await tx.ledgerEntry.create({
          data: {
            entity_type: LedgerEntityType.CUSTOMER,
            customer_id: dto.customer_id,
            transaction_type: TransactionType.CREDIT,
            amount: new Decimal(totalAmount),
            balance: updatedCustomer.current_balance,
            description: `Repair Invoice #${invoiceNumber}`,
            reference_number: invoiceNumber,
            transaction_date: receivedDate,
            repair_invoice_id: repairInvoice.id,
          },
        });

        if (receivedAmount > 0 && dto.account_id) {
          const receiptNumber = await this.generateReceiptNumber(tx);
          const receipt = await tx.receipt.create({
            data: {
              receipt_number: receiptNumber,
              customer_id: dto.customer_id,
              account_id: dto.account_id!,
              admin_id: adminId,
              amount: new Decimal(receivedAmount),
              receipt_date: receivedDate,
              repair_invoice_id: repairInvoice.id,
              notes: `Payment for Repair Invoice #${invoiceNumber}`,
            },
          });
          const customerAfter = await tx.customer.update({
            where: { id: dto.customer_id },
            data: {
              current_balance: { decrement: new Decimal(receivedAmount) },
            },
          });
          await tx.ledgerEntry.create({
            data: {
              entity_type: LedgerEntityType.CUSTOMER,
              customer_id: dto.customer_id,
              transaction_type: TransactionType.DEBIT,
              amount: new Decimal(receivedAmount),
              balance: customerAfter.current_balance,
              description: `Receipt #${receiptNumber} for Repair #${invoiceNumber}`,
              reference_number: receiptNumber,
              transaction_date: receivedDate,
              receipt_id: receipt.id,
              repair_invoice_id: repairInvoice.id,
            },
          });
          const updatedAccount = await tx.account.update({
            where: { id: dto.account_id! },
            data: {
              current_balance: { increment: new Decimal(receivedAmount) },
            },
          });
          await tx.ledgerEntry.create({
            data: {
              entity_type: LedgerEntityType.ACCOUNT,
              account_id: dto.account_id!,
              transaction_type: TransactionType.CREDIT,
              amount: new Decimal(receivedAmount),
              balance: updatedAccount.current_balance,
              description: `Receipt #${receiptNumber} - Repair #${invoiceNumber}`,
              reference_number: receiptNumber,
              transaction_date: receivedDate,
              receipt_id: receipt.id,
            },
          });
        }
      }

      return repairInvoice;
    });

    this.logger.log(`Created repair invoice ${result.invoice_number}`);
    return this.findOne(result.id);
  }

  private async generateReceiptNumber(tx: {
    receipt: { findFirst: (args: unknown) => Promise<{ receipt_number: string } | null> };
  }): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `REC-${year}-`;
    const last = await tx.receipt.findFirst({
      where: { receipt_number: { startsWith: prefix } },
      orderBy: { receipt_number: 'desc' },
    } as Parameters<typeof tx.receipt.findFirst>[0]);
    const next = last ? parseInt(last.receipt_number.replace(prefix, ''), 10) + 1 : 1;
    return `${prefix}${next.toString().padStart(4, '0')}`;
  }

  async updateStatus(id: number, dto: UpdateRepairStatusDto, adminId: number) {
    const repair = await this.prisma.repairInvoice.findUnique({
      where: { id },
      include: {
        repair_items: {
          where: { item_id: { not: null }, is_bush: false },
          include: { item: true },
        },
      },
    });
    if (!repair) {
      throw new NotFoundException(`Repair invoice with ID ${id} not found`);
    }

    const current = repair.repair_status;
    const next = dto.repair_status;

    const allowed: Record<RepairStatus, RepairStatus[]> = {
      [RepairStatus.PENDING]: [RepairStatus.IN_PROGRESS],
      [RepairStatus.IN_PROGRESS]: [RepairStatus.COMPLETED],
      [RepairStatus.COMPLETED]: [RepairStatus.DELIVERED],
      [RepairStatus.DELIVERED]: [],
    };
    if (!allowed[current].includes(next)) {
      throw new BadRequestException(
        `Cannot transition from ${current} to ${next}. Allowed: ${allowed[current].join(', ') || 'none'}`,
      );
    }

    if (current === RepairStatus.PENDING && next === RepairStatus.IN_PROGRESS) {
      await this.prisma.$transaction(async (tx) => {
        for (const line of repair.repair_items) {
          if (!line.item_id || !line.item) continue;
          const qty = new Decimal(line.quantity.toString());
          await tx.stockAdjustment.create({
            data: {
              item_id: line.item_id,
              admin_id: adminId,
              quantity: qty.mul(-1),
              avg_price: line.cost_price ?? line.item.avg_price,
              reason: `Repair invoice #${repair.invoice_number} - parts used`,
              notes: line.description,
              repair_invoice_id: repair.id,
            },
          });
          await tx.item.update({
            where: { id: line.item_id },
            data: { quantity: { decrement: qty } },
          });
        }
      });
    }

    const updateData: {
      repair_status: RepairStatus;
      repair_date?: Date;
      delivery_date?: Date;
    } = { repair_status: next };
    if (next === RepairStatus.COMPLETED) {
      updateData.repair_date = new Date();
    } else if (next === RepairStatus.DELIVERED) {
      updateData.delivery_date = new Date();
    }

    const updated = await this.prisma.repairInvoice.update({
      where: { id },
      data: updateData,
    });
    this.logger.log(`Repair invoice ${repair.invoice_number} status: ${current} → ${next}`);
    return this.findOne(updated.id);
  }

  async findOne(id: number) {
    const repair = await this.prisma.repairInvoice.findUnique({
      where: { id },
      include: {
        customer: { select: { id: true, name: true } },
        repair_items: { include: { item: { select: { id: true, name: true } } } },
      },
    });
    if (!repair) {
      throw new NotFoundException(`Repair invoice with ID ${id} not found`);
    }
    return this.mapToResponse(repair);
  }

  async findAll(filters?: {
    customer_id?: number;
    is_foc?: boolean;
    repair_status?: RepairStatus;
    page?: number;
    limit?: number;
  }) {
    const page = filters?.page ?? 1;
    const limit = Math.min(Math.max(filters?.limit ?? 10, 1), 100);
    const skip = (page - 1) * limit;
    const where: {
      customer_id?: number;
      is_foc?: boolean;
      repair_status?: RepairStatus;
    } = {};
    //localhost:3333/api/v1/repair-invoices/2

    http: if (filters?.customer_id) where.customer_id = filters.customer_id;
    if (filters?.is_foc !== undefined) where.is_foc = filters.is_foc;
    if (filters?.repair_status) where.repair_status = filters.repair_status;

    const [list, total] = await Promise.all([
      this.prisma.repairInvoice.findMany({
        where,
        skip,
        take: limit,
        orderBy: { id: 'desc' },
        include: {
          customer: { select: { id: true, name: true } },
          repair_items: { include: { item: { select: { id: true, name: true } } } },
        },
      }),
      this.prisma.repairInvoice.count({ where }),
    ]);

    const data = list.map((r) => ({
      ...this.mapToResponse({ ...r, customer: r.customer }),
      customer_name: r.customer.name,
    }));
    return new PaginatedResponseDto(data, total, page, limit);
  }

  private mapToResponse(repair: {
    id: number;
    invoice_number: string;
    customer_id: number;
    item_type: ItemType | null;
    item_id: number | null;
    production_item_id: number | null;
    serial_number: string | null;
    item_description: string | null;
    is_foc: boolean;
    repair_status: RepairStatus;
    received_date: Date;
    repair_date: Date | null;
    delivery_date: Date | null;
    parts_cost: unknown;
    service_charges: unknown;
    total_amount: unknown;
    received_amount: unknown;
    payment_status: PaymentStatus;
    notes: string | null;
    technician_notes: string | null;
    repair_items: Array<{
      id: number;
      item_id: number | null;
      description: string;
      quantity: unknown;
      unit_price: unknown;
      total_price: unknown;
      cost_price: unknown;
      is_bush: boolean;
      item?: { name: string } | null;
    }>;
    customer?: { name: string };
  }) {
    return {
      id: repair.id,
      invoice_number: repair.invoice_number,
      customer_id: repair.customer_id,
      customer_name: repair.customer?.name,
      item_type: repair.item_type,
      item_id: repair.item_id,
      production_item_id: repair.production_item_id,
      serial_number: repair.serial_number,
      item_description: repair.item_description,
      is_foc: repair.is_foc,
      repair_status: repair.repair_status,
      received_date: repair.received_date,
      repair_date: repair.repair_date,
      delivery_date: repair.delivery_date,
      parts_cost: new Decimal(repair.parts_cost as string).toFixed(2),
      service_charges: new Decimal(repair.service_charges as string).toFixed(2),
      total_amount: new Decimal(repair.total_amount as string).toFixed(2),
      received_amount: new Decimal(repair.received_amount as string).toFixed(2),
      payment_status: repair.payment_status,
      notes: repair.notes,
      technician_notes: repair.technician_notes,
      items: repair.repair_items.map((i) => ({
        id: i.id,
        item_id: i.item_id,
        item_name: i.item?.name ?? null,
        description: i.description,
        quantity: i.quantity,
        unit_price: i.unit_price,
        total_price: i.total_price,
        cost_price: i.cost_price,
        inventory_count: !i.is_bush,
      })),
    };
  }
}
