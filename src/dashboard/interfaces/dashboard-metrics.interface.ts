export interface AmountMetric {
  amount: number;
}

export interface AmountCountMetric extends AmountMetric {
  count: number;
}

export interface PercentChangeMetric extends AmountMetric {
  percentChange?: number;
}

export interface AccountBalance {
  id: number;
  name: string;
  type: string;
  balance: number;
}

export interface TrendDataPoint {
  date: string;
  amount?: number;
  count?: number;
}

export type PeriodType = 'today' | 'week' | 'month';
