import { Injectable, NotFoundException } from '@nestjs/common';
import { PaymentStatus } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { PrismaService } from '../common/database/prisma.service';
import { LoggerService } from '../common/logger/logger.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { CustomerStatementDto } from './dto/customer-statement.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { PaginatedResponseDto } from '../common/dto/pagination-response.dto';
import { PaginationUtil } from '../common/utils/pagination.util';

@Injectable()
export class CustomerService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: LoggerService,
  ) {
    this.logger.setContext('CustomerService');
  }

  async create(createCustomerDto: CreateCustomerDto) {
    const customer = await this.prisma.customer.create({
      data: {
        name: createCustomerDto.name,
        company_name: createCustomerDto.company_name,
        phone: createCustomerDto.phone,
        address: createCustomerDto.address,
        opening_balance: createCustomerDto.opening_balance || 0,
        current_balance: createCustomerDto.opening_balance || 0,
      },
    });

    this.logger.log(`Created customer: ${customer.name}`);
    return customer;
  }

  async findAll(paginationDto: PaginationDto): Promise<PaginatedResponseDto<any>> {
    const { page = 1, limit = 10, search, sortBy = 'created_at', sortOrder } = paginationDto;

    const skip = PaginationUtil.getSkip(page, limit);
    const orderBy = PaginationUtil.buildOrderBy(sortBy, sortOrder);

    // Build search conditions
    const where = PaginationUtil.buildSearchWhere(search, ['name', 'company_name', 'phone']);

    const [customers, total] = await Promise.all([
      this.prisma.customer.findMany({
        where,
        skip,
        take: limit,
        orderBy,
      }),
      this.prisma.customer.count({ where }),
    ]);

    return PaginationUtil.createPaginatedResponse(customers, total, paginationDto);
  }

  async findOne(id: number) {
    const customer = await this.prisma.customer.findUnique({
      where: { id },
    });

    if (!customer) {
      throw new NotFoundException(`Customer with ID ${id} not found`);
    }

    return customer;
  }

  async update(id: number, updateCustomerDto: UpdateCustomerDto) {
    await this.findOne(id); // Check if exists

    const customer = await this.prisma.customer.update({
      where: { id },
      data: {
        name: updateCustomerDto.name,
        company_name: updateCustomerDto.company_name,
        phone: updateCustomerDto.phone,
        address: updateCustomerDto.address,
        opening_balance: updateCustomerDto.opening_balance,
      },
    });

    this.logger.log(`Updated customer: ${customer.name}`);
    return customer;
  }

  async remove(id: number) {
    await this.findOne(id); // Check if exists

    await this.prisma.customer.delete({
      where: { id },
    });

    this.logger.log(`Deleted customer with ID: ${id}`);
    return { message: 'Customer deleted successfully' };
  }

  async getStatement(
    id: number,
    fromDate?: string,
    toDate?: string,
  ): Promise<CustomerStatementDto> {
    const customer = await this.findOne(id);

    const invoiceDateFilter: { customer_id: number; invoice_date?: { gte?: Date; lte?: Date } } = {
      customer_id: id,
    };
    if (fromDate || toDate) {
      invoiceDateFilter.invoice_date = {};
      if (fromDate) {
        invoiceDateFilter.invoice_date.gte = new Date(fromDate);
      }
      if (toDate) {
        invoiceDateFilter.invoice_date.lte = new Date(toDate);
      }
    }

    const receiptDateFilter: { customer_id: number; receipt_date?: { gte?: Date; lte?: Date } } = {
      customer_id: id,
    };
    if (fromDate || toDate) {
      receiptDateFilter.receipt_date = {};
      if (fromDate) {
        receiptDateFilter.receipt_date.gte = new Date(fromDate);
      }
      if (toDate) {
        receiptDateFilter.receipt_date.lte = new Date(toDate);
      }
    }

    const [invoices, receipts] = await Promise.all([
      this.prisma.saleInvoice.findMany({
        where: invoiceDateFilter,
        orderBy: { invoice_date: 'desc' },
      }),
      this.prisma.receipt.findMany({
        where: receiptDateFilter,
        include: {
          account: { select: { name: true } },
          sale_invoice: { select: { invoice_number: true } },
        },
        orderBy: { receipt_date: 'desc' },
      }),
    ]);

    const totalSales = invoices.reduce(
      (sum, inv) => sum.add(inv.total_amount),
      new Decimal(0),
    );
    const totalReceipts = receipts.reduce(
      (sum, rec) => sum.add(rec.amount),
      new Decimal(0),
    );
    const unpaidCount = invoices.filter(
      (inv) => inv.payment_status === PaymentStatus.UNPAID,
    ).length;
    const partialCount = invoices.filter(
      (inv) => inv.payment_status === PaymentStatus.PARTIAL,
    ).length;

    const invoiceDtos = invoices.map((invoice) => {
      const outstanding = new Decimal(invoice.total_amount.toString()).sub(
        new Decimal(invoice.received_amount.toString()),
      );
      return {
        id: invoice.id,
        invoice_number: invoice.invoice_number,
        invoice_date: invoice.invoice_date,
        due_date: invoice.due_date ?? undefined,
        total_amount: new Decimal(invoice.total_amount.toString()).toFixed(2),
        received_amount: new Decimal(invoice.received_amount.toString()).toFixed(2),
        outstanding_amount: outstanding.toFixed(2),
        payment_status: invoice.payment_status,
        notes: invoice.notes ?? undefined,
      };
    });

    const receiptDtos = receipts.map((receipt) => ({
      id: receipt.id,
      receipt_number: receipt.receipt_number,
      receipt_date: receipt.receipt_date,
      amount: new Decimal(receipt.amount.toString()).toFixed(2),
      invoice_number: receipt.sale_invoice?.invoice_number,
      invoice_id: receipt.sale_invoice_id ?? undefined,
      account_name: receipt.account.name,
      notes: receipt.notes ?? undefined,
    }));

    return {
      customer_id: customer.id,
      customer_name: customer.name,
      company_name: customer.company_name ?? undefined,
      phone: customer.phone ?? undefined,
      address: customer.address ?? undefined,
      opening_balance: new Decimal(customer.opening_balance.toString()).toFixed(2),
      current_balance: new Decimal(customer.current_balance.toString()).toFixed(2),
      summary: {
        total_sales: totalSales.toFixed(2),
        total_receipts: totalReceipts.toFixed(2),
        outstanding_balance: new Decimal(customer.current_balance.toString()).toFixed(2),
        invoice_count: invoices.length,
        receipt_count: receipts.length,
        unpaid_invoice_count: unpaidCount,
        partial_invoice_count: partialCount,
      },
      invoices: invoiceDtos,
      receipts: receiptDtos,
    };
  }
}
