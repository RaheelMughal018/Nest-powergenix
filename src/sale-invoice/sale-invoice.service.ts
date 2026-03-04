import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PaymentStatus } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { PaginatedResponseDto } from '../common/dto/pagination-response.dto';
import { PrismaService } from '../common/database/prisma.service';
import { LoggerService } from '../common/logger/logger.service';
import { CreateSaleInvoiceDto } from './dto/create-sale-invoice.dto';
import { SaleInvoiceAccountingProvider } from './providers/sale-invoice-accounting.provider';
import { SaleInvoiceInventoryProvider } from './providers/sale-invoice-inventory.provider';
import { SaleInvoicePaymentProvider } from './providers/sale-invoice-payment.provider';
import { SaleInvoicePricingProvider } from './providers/sale-invoice-pricing.provider';
import { SaleInvoiceRepository } from './providers/sale-invoice-repository';

@Injectable()
export class SaleInvoiceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: LoggerService,
    private readonly inventoryService: SaleInvoiceInventoryProvider,
    private readonly pricingService: SaleInvoicePricingProvider,
    private readonly invoiceRepository: SaleInvoiceRepository,
    private readonly accountingService: SaleInvoiceAccountingProvider,
    private readonly receiptService: SaleInvoicePaymentProvider,
  ) {
    this.logger.setContext('SaleInvoiceService');
  }

  /**
   * Create sale invoice with business rules:
   * - FINAL: item_id + serial_number, qty=1, unit_price from ProductionItem.cost_price, mark is_sold, deduct Item.quantity by 1.
   * - RAW: item_id + quantity, unit_price from Item.avg_price, deduct Item.quantity.
   * - Payment: UNPAID (no receipt), PAID/PARTIAL (receipt + ledger + account).
   */
  async create(dto: CreateSaleInvoiceDto, adminId: number) {
    if (!dto.items?.length) {
      throw new BadRequestException('At least one line item is required');
    }

    const customer = await this.prisma.customer.findUnique({
      where: { id: dto.customer_id },
    });
    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    const isPayment =
      dto.payment_status === PaymentStatus.PAID ||
      dto.payment_status === PaymentStatus.PARTIAL;
    if (isPayment) {
      if (dto.received_amount == null || dto.received_amount < 0) {
        throw new BadRequestException(
          'received_amount is required when payment_status is PAID or PARTIAL',
        );
      }
      if (
        dto.payment_status === PaymentStatus.PAID &&
        dto.received_amount <= 0
      ) {
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

    const result = await this.prisma.$transaction(async (tx) => {
      const resolvedItems = await this.inventoryService.resolveItems(
        dto.items,
        tx,
      );

      const totals = this.pricingService.calculate(resolvedItems, dto);

      const invoice = await this.invoiceRepository.create(
        dto,
        adminId,
        totals,
        resolvedItems,
        tx,
      );

      await this.inventoryService.applyStockChanges(resolvedItems, tx);

      await this.accountingService.handleCustomerDebt(
        dto.customer_id,
        totals,
        invoice,
        tx,
      );

      if (totals.receivedAmount > 0) {
        await this.receiptService.handlePayment(
          dto,
          invoice,
          totals,
          adminId,
          tx,
        );
      }

      return invoice;
    });

    this.logger.log(`Created sale invoice ${result.invoice_number}`);
    return this.findOne(result.id);
  }

  async findOne(id: number) {
    const invoice = await this.prisma.saleInvoice.findUnique({
      where: { id },
      include: {
        customer: { select: { id: true, name: true } },
        items: {
          include: {
            item: { select: { id: true, name: true } },
            production_item: { select: { id: true, serial_number: true } },
          },
        },
      },
    });
    if (!invoice) {
      throw new NotFoundException(`Sale invoice with ID ${id} not found`);
    }
    const outstanding = new Decimal(invoice.total_amount.toString()).sub(
      new Decimal(invoice.received_amount.toString()),
    );
    return {
      ...invoice,
      customer_name: invoice.customer.name,
      items: invoice.items.map((i) => ({
        id: i.id,
        item_id: i.item_id,
        item_name: i.item.name,
        serial_number: i.production_item?.serial_number ?? null,
        quantity: i.quantity,
        unit_price: i.unit_price,
        total_price: i.total_price,
        production_item_id: i.production_item_id,
        created_at: i.created_at,
      })),
      outstanding_amount: outstanding,
    };
  }

  async findAll(filters?: {
    customer_id?: number;
    payment_status?: PaymentStatus;
    page?: number;
    limit?: number;
  }) {
    const page = filters?.page ?? 1;
    const limit = Math.min(Math.max(filters?.limit ?? 10, 1), 100);
    const skip = (page - 1) * limit;
    const where: {
      customer_id?: number;
      payment_status?: PaymentStatus;
    } = {};
    if (filters?.customer_id) where.customer_id = filters.customer_id;
    if (filters?.payment_status)
      where.payment_status = filters.payment_status;

    const [invoices, total] = await Promise.all([
      this.prisma.saleInvoice.findMany({
        where,
        skip,
        take: limit,
        orderBy: { id: 'desc' },
        include: {
          customer: { select: { id: true, name: true } },
        },
      }),
      this.prisma.saleInvoice.count({ where }),
    ]);

    const items = invoices.map((inv) => ({
      ...inv,
      customer_name: inv.customer.name,
      outstanding_amount: new Decimal(inv.total_amount.toString()).sub(
        new Decimal(inv.received_amount.toString()),
      ),
    }));
    return new PaginatedResponseDto(items, total, page, limit);
  }
}
