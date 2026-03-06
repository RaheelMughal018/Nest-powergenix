import { Injectable } from '@nestjs/common';
import { DateRange } from '../interfaces/date-range.interface';
import { PeriodType } from '../interfaces/dashboard-metrics.interface';

@Injectable()
export class DashboardHelperService {
  /**
   * Get start and end of today (UTC date only, time 00:00:00).
   */
  getTodayRange(): DateRange {
    const now = new Date();
    const start = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
    const end = new Date(start);
    end.setUTCDate(end.getUTCDate() + 1);
    return { start, end };
  }

  /**
   * Get start and end of yesterday.
   */
  getYesterdayRange(): DateRange {
    const today = this.getTodayRange();
    const start = new Date(today.start);
    start.setUTCDate(start.getUTCDate() - 1);
    const end = new Date(today.start);
    return { start, end };
  }

  /**
   * Get date range for period: today, week (last 7 days), month (current month).
   */
  getRangeForPeriod(period: PeriodType): DateRange {
    const now = new Date();
    if (period === 'today') {
      return this.getTodayRange();
    }
    if (period === 'week') {
      const end = new Date(now);
      end.setUTCHours(23, 59, 59, 999);
      const start = new Date(end);
      start.setUTCDate(start.getUTCDate() - 6);
      start.setUTCHours(0, 0, 0, 0);
      return { start, end };
    }
    // month: first day to end of current day
    const start = new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1));
    const end = new Date(now);
    end.setUTCHours(23, 59, 59, 999);
    return { start, end };
  }

  /**
   * Get previous period range (same length as current).
   */
  getPreviousPeriodRange(period: PeriodType): DateRange {
    const current = this.getRangeForPeriod(period);
    const diff = current.end.getTime() - current.start.getTime();
    const end = new Date(current.start.getTime() - 1);
    const start = new Date(end.getTime() - diff);
    return { start, end };
  }

  /**
   * Get last N days range (for trends).
   * @param days Number of days
   * @param endDate Optional end date; if omitted, uses end of current day.
   */
  getLastDaysRange(days: number, endDate?: Date): DateRange {
    const end = endDate ? new Date(endDate) : new Date();
    end.setUTCHours(23, 59, 59, 999);
    const start = new Date(end);
    start.setUTCDate(start.getUTCDate() - days + 1);
    start.setUTCHours(0, 0, 0, 0);
    return { start, end };
  }

  /**
   * Get start and end of a specific day (UTC).
   */
  getRangeForDate(date: Date): DateRange {
    const start = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
    const end = new Date(start);
    end.setUTCDate(end.getUTCDate() + 1);
    return { start, end };
  }

  /**
   * Get start and end of the day before the given date.
   */
  getYesterdayRangeFor(asOfDate: Date): DateRange {
    const dayStart = new Date(
      Date.UTC(asOfDate.getUTCFullYear(), asOfDate.getUTCMonth(), asOfDate.getUTCDate()),
    );
    const end = new Date(dayStart);
    const start = new Date(dayStart);
    start.setUTCDate(start.getUTCDate() - 1);
    return { start, end };
  }

  /**
   * Calculate percentage change between two values.
   */
  percentChange(current: number, previous: number): number | undefined {
    if (previous === 0) return current > 0 ? 100 : undefined;
    return Number((((current - previous) / previous) * 100).toFixed(1));
  }

  /**
   * Format date as YYYY-MM-DD.
   */
  formatDateKey(d: Date): string {
    return d.toISOString().slice(0, 10);
  }
}
