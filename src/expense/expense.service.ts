import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../common/database/prisma.service';
import { LoggerService } from '../common/logger/logger.service';
import { AccountService } from '../account/account.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { BulkExpensesByDayDto } from './dto/bulk-expenses-by-day.dto';
import { TransactionType } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

/** Expenses are out-of-pocket spending (e.g. utilities, supplies). They are not linked to purchase invoices. */
@Injectable()
export class ExpenseService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: LoggerService,
    private readonly accountService: AccountService,
  ) {
    this.logger.setContext('ExpenseService');
  }

  private parseExpenseDate(value: string | undefined): Date {
    if (!value) return new Date();
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) {
      throw new BadRequestException(`Invalid expense_date: ${value}`);
    }
    return d;
  }

  async create(dto: CreateExpenseDto, adminId: number) {
    const category = await this.prisma.expenseCategory.findUnique({
      where: { id: dto.category_id },
    });
    if (!category) {
      throw new NotFoundException(`Expense category with ID ${dto.category_id} not found`);
    }
    const account = await this.prisma.account.findUnique({
      where: { id: dto.account_id },
    });
    if (!account) {
      throw new NotFoundException(`Account with ID ${dto.account_id} not found`);
    }

    const expenseDate = this.parseExpenseDate(dto.expense_date);
    const amount = Number(dto.amount);

    const expense = await this.prisma.expense.create({
      data: {
        category_id: dto.category_id,
        account_id: dto.account_id,
        admin_id: adminId,
        amount: new Decimal(amount),
        description: dto.description.trim(),
        expense_date: expenseDate,
        notes: dto.notes?.trim() ?? null,
        receipt_image: dto.receipt_image?.trim() ?? null,
      },
    });

    await this.accountService.createLedgerEntry(
      dto.account_id,
      TransactionType.DEBIT,
      amount,
      dto.description.trim(),
      undefined,
      { expense_id: expense.id },
    );

    this.logger.log(`Created expense ${expense.id} (${amount})`);
    return this.findOne(expense.id);
  }

  /**
   * Create multiple expenses for a single day. All items use the same date.
   * Each expense creates a DEBIT ledger entry on its account.
   */
  async createBulkByDay(dto: BulkExpensesByDayDto, adminId: number) {
    const expenseDate = this.parseExpenseDate(dto.date);
    const categoryIds = [...new Set(dto.expenses.map((e) => e.category_id))];
    const accountIds = [...new Set(dto.expenses.map((e) => e.account_id))];

    const [categories, accounts] = await Promise.all([
      this.prisma.expenseCategory.findMany({
        where: { id: { in: categoryIds } },
        select: { id: true },
      }),
      this.prisma.account.findMany({
        where: { id: { in: accountIds } },
        select: { id: true },
      }),
    ]);
    const categorySet = new Set(categories.map((c) => c.id));
    const accountSet = new Set(accounts.map((a) => a.id));
    const missingCategories = categoryIds.filter((id) => !categorySet.has(id));
    const missingAccounts = accountIds.filter((id) => !accountSet.has(id));
    if (missingCategories.length) {
      throw new NotFoundException(
        `Expense category(ies) not found: ${missingCategories.join(', ')}`,
      );
    }
    if (missingAccounts.length) {
      throw new NotFoundException(
        `Account(s) not found: ${missingAccounts.join(', ')}`,
      );
    }

    const created: Awaited<ReturnType<ExpenseService['findOne']>>[] = [];
    for (const item of dto.expenses) {
      const amount = Number(item.amount);
      const expense = await this.prisma.expense.create({
        data: {
          category_id: item.category_id,
          account_id: item.account_id,
          admin_id: adminId,
          amount: new Decimal(amount),
          description: item.description.trim(),
          expense_date: expenseDate,
          notes: item.notes?.trim() ?? null,
        },
      });
      await this.accountService.createLedgerEntry(
        item.account_id,
        TransactionType.DEBIT,
        amount,
        item.description.trim(),
        undefined,
        { expense_id: expense.id },
      );
      created.push(await this.findOne(expense.id));
    }

    this.logger.log(`Created ${created.length} expenses for ${dto.date}`);
    return created;
  }

  async findAll(filters?: { from?: string; to?: string; search?: string }) {
    const where: Record<string, unknown> = {};

    if (filters?.from) {
      const from = new Date(filters.from);
      if (!Number.isNaN(from.getTime())) {
        where.expense_date = { ...((where.expense_date as object) || {}), gte: from };
      }
    }
    if (filters?.to) {
      const to = new Date(filters.to);
      if (!Number.isNaN(to.getTime())) {
        where.expense_date = { ...((where.expense_date as object) || {}), lte: to };
      }
    }

    const searchTrimmed = filters?.search?.trim();
    if (searchTrimmed) {
      const searchConditions: Record<string, unknown>[] = [
        { description: { contains: searchTrimmed, mode: 'insensitive' as const } },
        { notes: { contains: searchTrimmed, mode: 'insensitive' as const } },
        { category: { name: { contains: searchTrimmed, mode: 'insensitive' as const } } },
        { account: { name: { contains: searchTrimmed, mode: 'insensitive' as const } } },
        { admin: { name: { contains: searchTrimmed, mode: 'insensitive' as const } } },
      ];
      const amountNum = Number(searchTrimmed);
      if (!Number.isNaN(amountNum) && amountNum >= 0) {
        searchConditions.push({ amount: amountNum });
      }
      where.OR = searchConditions;
    }

    return this.prisma.expense.findMany({
      where: Object.keys(where).length ? where : undefined,
      orderBy: { expense_date: 'desc' },
      include: {
        category: { select: { id: true, name: true } },
        account: { select: { id: true, name: true, account_type: true } },
        admin: { select: { id: true, name: true } },
      },
    });
  }

  async findOne(id: number) {
    const expense = await this.prisma.expense.findUnique({
      where: { id },
      include: {
        category: { select: { id: true, name: true } },
        account: { select: { id: true, name: true, account_type: true } },
        admin: { select: { id: true, name: true } },
      },
    });
    if (!expense) {
      throw new NotFoundException(`Expense with ID ${id} not found`);
    }
    return expense;
  }

  async update(id: number, dto: UpdateExpenseDto) {
    await this.findOne(id);
    const data: Record<string, unknown> = {};
    if (dto.category_id !== undefined) data.category_id = dto.category_id;
    if (dto.account_id !== undefined) data.account_id = dto.account_id;
    if (dto.amount !== undefined) data.amount = new Decimal(Number(dto.amount));
    if (dto.description !== undefined) data.description = dto.description.trim();
    if (dto.expense_date !== undefined) {
      data.expense_date = this.parseExpenseDate(dto.expense_date);
    }
    if (dto.notes !== undefined) data.notes = dto.notes?.trim() ?? null;
    if (dto.receipt_image !== undefined) data.receipt_image = dto.receipt_image?.trim() ?? null;

    const expense = await this.prisma.expense.update({
      where: { id },
      data,
    });
    this.logger.log(`Updated expense ${id}`);
    return this.findOne(expense.id);
  }

  async remove(id: number) {
    const expense = await this.findOne(id);
    const amount = Number(expense.amount);
    const accountId = expense.account_id;
    const ledgerEntry = await this.prisma.ledgerEntry.findFirst({
      where: { expense_id: id },
    });
    if (ledgerEntry) {
      await this.accountService.createLedgerEntry(
        accountId,
        TransactionType.CREDIT,
        amount,
        `Reversal: expense #${id} deleted`,
        undefined,
        {},
      );
    }
    await this.prisma.expense.delete({ where: { id } });
    this.logger.log(`Deleted expense ${id}`);
    return { message: 'Expense deleted successfully' };
  }
}
