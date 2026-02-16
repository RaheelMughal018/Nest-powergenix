import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/database/prisma.service';
import { LoggerService } from '../common/logger/logger.service';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { PaginatedResponseDto } from '../common/dto/pagination-response.dto';
import { PaginationUtil } from '../common/utils/pagination.util';
import { SupplierStatementDto } from './dto/supplier-statement.dto';
import { PaymentStatus } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class SupplierService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: LoggerService,
  ) {
    this.logger.setContext('SupplierService');
  }

  async create(createSupplierDto: CreateSupplierDto) {
    const supplier = await this.prisma.supplier.create({
      data: {
        name: createSupplierDto.name,
        company_name: createSupplierDto.company_name,
        phone: createSupplierDto.phone,
        address: createSupplierDto.address,
        opening_balance: createSupplierDto.opening_balance || 0,
        current_balance: createSupplierDto.opening_balance || 0,
      },
    });

    this.logger.log(`Created supplier: ${supplier.name}`);
    return supplier;
  }

  async findAll(paginationDto: PaginationDto): Promise<PaginatedResponseDto<any>> {
    const { page = 1, limit = 10, search, sortBy = 'created_at', sortOrder } = paginationDto;

    const skip = PaginationUtil.getSkip(page, limit);
    const orderBy = PaginationUtil.buildOrderBy(sortBy, sortOrder);

    // Build search conditions
    const where = PaginationUtil.buildSearchWhere(search, ['name', 'company_name', 'phone']);

    const [suppliers, total] = await Promise.all([
      this.prisma.supplier.findMany({
        where,
        skip,
        take: limit,
        orderBy,
      }),
      this.prisma.supplier.count({ where }),
    ]);

    return PaginationUtil.createPaginatedResponse(suppliers, total, paginationDto);
  }

  async findOne(id: number) {
    const supplier = await this.prisma.supplier.findUnique({
      where: { id },
    });

    if (!supplier) {
      throw new NotFoundException(`Supplier with ID ${id} not found`);
    }

    return supplier;
  }

  async update(id: number, updateSupplierDto: UpdateSupplierDto) {
    await this.findOne(id); // Check if exists

    const supplier = await this.prisma.supplier.update({
      where: { id },
      data: {
        name: updateSupplierDto.name,
        company_name: updateSupplierDto.company_name,
        phone: updateSupplierDto.phone,
        address: updateSupplierDto.address,
        opening_balance: updateSupplierDto.opening_balance,
      },
    });

    this.logger.log(`Updated supplier: ${supplier.name}`);
    return supplier;
  }

  async remove(id: number) {
    await this.findOne(id); // Check if exists

    await this.prisma.supplier.delete({
      where: { id },
    });

    this.logger.log(`Deleted supplier with ID: ${id}`);
    return { message: 'Supplier deleted successfully' };
  }

  async getStatement(id: number): Promise<SupplierStatementDto> {
    // Verify supplier exists
    const supplier = await this.findOne(id);

    // Fetch all purchase invoices for this supplier
    const invoices = await this.prisma.purchaseInvoice.findMany({
      where: { supplier_id: id },
      orderBy: { invoice_date: 'desc' },
    });

    // Fetch all payments for this supplier
    const payments = await this.prisma.payment.findMany({
      where: { supplier_id: id },
      include: {
        account: {
          select: { name: true },
        },
        purchase_invoice: {
          select: { invoice_number: true },
        },
      },
      orderBy: { payment_date: 'desc' },
    });

    // Calculate summary statistics
    const totalPurchases = invoices.reduce(
      (sum, inv) => sum.add(inv.total_amount),
      new Decimal(0),
    );

    const totalPayments = payments.reduce(
      (sum, pay) => sum.add(pay.amount),
      new Decimal(0),
    );

    const unpaidCount = invoices.filter(
      (inv) => inv.payment_status === PaymentStatus.UNPAID,
    ).length;

    const partialCount = invoices.filter(
      (inv) => inv.payment_status === PaymentStatus.PARTIAL,
    ).length;

    // Map invoices to DTO
    const invoiceDtos = invoices.map((invoice) => {
      const outstanding = new Decimal(invoice.total_amount).sub(
        invoice.paid_amount,
      );
      return {
        id: invoice.id,
        invoice_number: invoice.invoice_number,
        invoice_date: invoice.invoice_date,
        due_date: invoice.due_date ?? undefined,
        total_amount: invoice.total_amount.toFixed(2),
        paid_amount: invoice.paid_amount.toFixed(2),
        outstanding_amount: outstanding.toFixed(2),
        payment_status: invoice.payment_status,
        notes: invoice.notes ?? undefined,
      };
    });

    // Map payments to DTO
    const paymentDtos = payments.map((payment) => ({
      id: payment.id,
      payment_number: payment.payment_number,
      payment_date: payment.payment_date,
      amount: payment.amount.toFixed(2),
      invoice_number: payment.purchase_invoice?.invoice_number,
      invoice_id: payment.purchase_invoice_id ?? undefined,
      account_name: payment.account.name,
      notes: payment.notes ?? undefined,
    }));

    return {
      supplier_id: supplier.id,
      supplier_name: supplier.name,
      company_name: supplier.company_name ?? undefined,
      phone: supplier.phone ?? undefined,
      address: supplier.address ?? undefined,
      opening_balance: supplier.opening_balance.toFixed(2),
      current_balance: supplier.current_balance.toFixed(2),
      summary: {
        total_purchases: totalPurchases.toFixed(2),
        total_payments: totalPayments.toFixed(2),
        outstanding_balance: supplier.current_balance.toFixed(2),
        invoice_count: invoices.length,
        payment_count: payments.length,
        unpaid_invoice_count: unpaidCount,
        partial_invoice_count: partialCount,
      },
      invoices: invoiceDtos,
      payments: paymentDtos,
    };
  }
}
