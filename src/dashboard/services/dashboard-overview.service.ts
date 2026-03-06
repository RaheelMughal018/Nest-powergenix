import { Injectable } from '@nestjs/common';
import { AccountType, Prisma } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { PrismaService } from '../../common/database/prisma.service';
import { LoggerService } from '../../common/logger/logger.service';
import { OverviewDashboardResponseDto } from '../dto/overview-dashboard.dto';
import { DashboardHelperService } from './dashboard-helper.service';

const LOW_STOCK_THRESHOLD = 10;

@Injectable()
export class DashboardOverviewService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: LoggerService,
    private readonly helper: DashboardHelperService,
  ) {
    this.logger.setContext('DashboardOverviewService');
  }

  async getOverview(query?: { date?: string; days?: number }): Promise<OverviewDashboardResponseDto> {
    try {
      const days = Math.min(90, Math.max(1, query?.days ?? 7));
      const asOfDate = query?.date
        ? new Date(query.date + 'T12:00:00Z')
        : undefined;

      const today = asOfDate
        ? this.helper.getRangeForDate(asOfDate)
        : this.helper.getTodayRange();
      const yesterday = asOfDate
        ? this.helper.getYesterdayRangeFor(asOfDate)
        : this.helper.getYesterdayRange();
      const trendsRange = asOfDate
        ? this.helper.getLastDaysRange(days, asOfDate)
        : this.helper.getLastDaysRange(days);

      const [
        todaySales,
        yesterdaySales,
        todayReceipts,
        yesterdayReceipts,
        todayRepairsCompleted,
        accounts,
        customersReceivable,
        suppliersPayable,
        items,
        lowStockItems,
        outOfStockItems,
        productionsInProgress,
        trendsSales,
        trendsPurchases,
        trendsRepairs,
      ] = await Promise.all([
        this.getTodaySales(today),
        this.getTodaySales(yesterday),
        this.getTodayCashCollected(today),
        this.getTodayCashCollected(yesterday),
        this.getTodayRepairsCompleted(today),
        this.prisma.account.findMany({
          select: { id: true, name: true, account_type: true, current_balance: true },
        }),
        this.prisma.customer.aggregate({
          where: { current_balance: { gt: 0 } },
          _sum: { current_balance: true },
          _count: true,
        }),
        this.prisma.supplier.aggregate({
          where: { current_balance: { gt: 0 } },
          _sum: { current_balance: true },
          _count: true,
        }),
        this.prisma.item.findMany({
          select: { id: true, name: true, quantity: true, avg_price: true },
        }),
        this.prisma.item.findMany({
          where: {
            quantity: { gt: 0, lt: LOW_STOCK_THRESHOLD },
          },
          select: { id: true, name: true, quantity: true },
        }),
        this.prisma.item.findMany({
          where: { quantity: 0 },
          select: { id: true, name: true, quantity: true },
        }),
        this.prisma.production.aggregate({
          where: {
            status: { in: ['DRAFT', 'IN_PROCESS'] },
          },
          _count: true,
          _sum: { quantity: true },
        }),
        this.getTrends(trendsRange, 'sales'),
        this.getTrends(trendsRange, 'purchases'),
        this.getTrends(trendsRange, 'repairs'),
      ]);

      const toNum = (v: Decimal | null | undefined) =>
        v == null ? 0 : Number(new Decimal(v.toString()).toNumber());
      const todaySalesAmount = toNum(todaySales._sum.total_amount);
      const todaySalesCount = todaySales._count;
      const yesterdaySalesAmount = toNum(yesterdaySales._sum.total_amount);
      const todayCashAmount = toNum(todayReceipts._sum.amount);
      const yesterdayCashAmount = toNum(yesterdayReceipts._sum.amount);

      const cashInHandTypes: AccountType[] = [
        AccountType.IN_HAND,
        AccountType.JAZZCASH,
        AccountType.EASYPAISA,
      ];
      const cashInHandAccounts = accounts.filter((a) =>
        cashInHandTypes.includes(a.account_type),
      );
      const bankAccounts = accounts.filter((a) => a.account_type === AccountType.BANK);
      const cashInHandAmount = cashInHandAccounts.reduce(
        (s, a) => s + Number(new Decimal(a.current_balance.toString()).toNumber()),
        0,
      );
      const bankBalanceAmount = bankAccounts.reduce(
        (s, a) => s + Number(new Decimal(a.current_balance.toString()).toNumber()),
        0,
      );
      const receivableAmount = Number(
        (customersReceivable._sum.current_balance as Decimal)?.toString() ?? 0,
      );
      const payableAmount = Number(
        (suppliersPayable._sum.current_balance as Decimal)?.toString() ?? 0,
      );
      const netPosition = cashInHandAmount + bankBalanceAmount + receivableAmount - payableAmount;

      const totalValue = items.reduce(
        (s, i) =>
          s +
          Number(new Decimal(i.quantity.toString()).toNumber()) *
            Number(new Decimal(i.avg_price.toString()).toNumber()),
        0,
      );

      return {
        today: {
          sales: {
            amount: todaySalesAmount,
            count: todaySalesCount,
            percentChange: this.helper.percentChange(
              todaySalesAmount,
              yesterdaySalesAmount,
            ),
          },
          cashCollected: {
            amount: todayCashAmount,
            percentChange: this.helper.percentChange(
              todayCashAmount,
              yesterdayCashAmount,
            ),
          },
          repairsCompleted: {
            count: todayRepairsCompleted,
          },
        },
        financial: {
          cashInHand: {
            amount: cashInHandAmount,
            accounts: cashInHandAccounts.map((a) => ({
              id: a.id,
              name: a.name,
              type: a.account_type,
              balance: Number(new Decimal(a.current_balance.toString()).toNumber()),
            })),
          },
          bankBalance: { amount: bankBalanceAmount },
          receivable: {
            amount: receivableAmount,
            customerCount: customersReceivable._count,
          },
          payable: {
            amount: payableAmount,
            supplierCount: suppliersPayable._count,
          },
          netPosition: { amount: netPosition },
        },
        inventory: {
          totalValue: { amount: totalValue },
          lowStock: {
            count: lowStockItems.length,
            items: lowStockItems.map((i) => ({
              id: i.id,
              name: i.name,
              quantity: Number(new Decimal(i.quantity.toString()).toNumber()),
              minQuantity: LOW_STOCK_THRESHOLD,
            })),
          },
          outOfStock: {
            count: outOfStockItems.length,
            items: outOfStockItems.map((i) => ({
              id: i.id,
              name: i.name,
              quantity: 0,
            })),
          },
          inProduction: {
            batchCount: productionsInProgress._count,
            unitCount: productionsInProgress._sum.quantity ?? 0,
          },
        },
        trends: {
          sales: trendsSales,
          purchases: trendsPurchases,
          repairs: trendsRepairs,
        },
      };
    } catch (error) {
      this.logger.error(`Overview dashboard failed: ${error}`);
      throw error;
    }
  }

  private async getTodaySales(range: { start: Date; end: Date }) {
    return this.prisma.saleInvoice.aggregate({
      where: {
        invoice_date: { gte: range.start, lt: range.end },
      },
      _sum: { total_amount: true },
      _count: true,
    });
  }

  private async getTodayCashCollected(range: { start: Date; end: Date }) {
    return this.prisma.receipt.aggregate({
      where: {
        receipt_date: { gte: range.start, lt: range.end },
      },
      _sum: { amount: true },
    });
  }

  private async getTodayRepairsCompleted(range: { start: Date; end: Date }): Promise<number> {
    const count = await this.prisma.repairInvoice.count({
      where: {
        repair_status: 'COMPLETED',
        repair_date: { gte: range.start, lt: range.end },
      },
    });
    return count;
  }

  private async getTrends(
    range: { start: Date; end: Date },
    type: 'sales' | 'purchases' | 'repairs',
  ): Promise<{ date: string; amount?: number; count?: number }[]> {
    if (type === 'repairs') {
      return this.getRepairsTrend(range);
    }
    if (type === 'sales') {
      return this.getSalesTrend(range);
    }
    return this.getPurchasesTrend(range);
  }

  private async getSalesTrend(range: {
    start: Date;
    end: Date;
  }): Promise<{ date: string; amount: number }[]> {
    const rows = await this.prisma.$queryRaw<
      { date: Date; amount: Prisma.Decimal }[]
    >(Prisma.sql`
      SELECT DATE(invoice_date) as date, COALESCE(SUM(total_amount), 0) as amount
      FROM sale_invoices
      WHERE invoice_date >= ${range.start} AND invoice_date < ${range.end}
      GROUP BY DATE(invoice_date)
      ORDER BY date
    `);
    return rows.map((r) => ({
      date: r.date.toISOString().slice(0, 10),
      amount: Number(r.amount?.toString() ?? 0),
    }));
  }

  private async getPurchasesTrend(range: {
    start: Date;
    end: Date;
  }): Promise<{ date: string; amount: number }[]> {
    const rows = await this.prisma.$queryRaw<
      { date: Date; amount: Prisma.Decimal }[]
    >(Prisma.sql`
      SELECT DATE(invoice_date) as date, COALESCE(SUM(total_amount), 0) as amount
      FROM purchase_invoices
      WHERE invoice_date >= ${range.start} AND invoice_date < ${range.end}
      GROUP BY DATE(invoice_date)
      ORDER BY date
    `);
    return rows.map((r) => ({
      date: r.date.toISOString().slice(0, 10),
      amount: Number(r.amount?.toString() ?? 0),
    }));
  }

  private async getRepairsTrend(range: {
    start: Date;
    end: Date;
  }): Promise<{ date: string; count: number }[]> {
    const rows = await this.prisma.$queryRaw<{ date: Date; count: bigint }[]>(
      Prisma.sql`
        SELECT DATE(received_date) as date, COUNT(*)::bigint as count
        FROM repair_invoices
        WHERE received_date >= ${range.start} AND received_date < ${range.end}
        GROUP BY DATE(received_date)
        ORDER BY date
      `,
    );
    return rows.map((r) => ({
      date: r.date.toISOString().slice(0, 10),
      count: Number(r.count),
    }));
  }
}
