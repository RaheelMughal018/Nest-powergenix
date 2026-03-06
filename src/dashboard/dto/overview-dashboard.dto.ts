import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TodaySalesDto {
  @ApiProperty()
  amount: number;
  @ApiProperty()
  count: number;
  @ApiPropertyOptional()
  percentChange?: number;
}

export class TodayCashCollectedDto {
  @ApiProperty()
  amount: number;
  @ApiPropertyOptional()
  percentChange?: number;
}

export class TodayRepairsCompletedDto {
  @ApiProperty()
  count: number;
}

export class AccountBalanceDto {
  @ApiProperty()
  id: number;
  @ApiProperty()
  name: string;
  @ApiProperty()
  type: string;
  @ApiProperty()
  balance: number;
}

export class CashInHandDto {
  @ApiProperty()
  amount: number;
  @ApiProperty({ type: [AccountBalanceDto] })
  accounts: AccountBalanceDto[];
}

export class FinancialOverviewDto {
  @ApiProperty()
  cashInHand: CashInHandDto;
  @ApiProperty()
  bankBalance: { amount: number };
  @ApiProperty()
  receivable: { amount: number; customerCount: number };
  @ApiProperty()
  payable: { amount: number; supplierCount: number };
  @ApiProperty()
  netPosition: { amount: number };
}

export class LowStockItemDto {
  @ApiProperty()
  id: number;
  @ApiProperty()
  name: string;
  @ApiProperty()
  quantity: number;
  @ApiProperty()
  minQuantity: number;
}

export class OutOfStockItemDto {
  @ApiProperty()
  id: number;
  @ApiProperty()
  name: string;
  @ApiProperty()
  quantity: number;
}

export class InventoryOverviewDto {
  @ApiProperty()
  totalValue: { amount: number };
  @ApiProperty()
  lowStock: { count: number; items: LowStockItemDto[] };
  @ApiProperty()
  outOfStock: { count: number; items: OutOfStockItemDto[] };
  @ApiProperty()
  inProduction: { batchCount: number; unitCount: number };
}

export class TrendPointDto {
  @ApiProperty()
  date: string;
  @ApiPropertyOptional()
  amount?: number;
  @ApiPropertyOptional()
  count?: number;
}

export class OverviewTrendsDto {
  @ApiProperty({ type: [TrendPointDto] })
  sales: TrendPointDto[];
  @ApiProperty({ type: [TrendPointDto] })
  purchases: TrendPointDto[];
  @ApiProperty({ type: [TrendPointDto] })
  repairs: TrendPointDto[];
}

export class OverviewDashboardResponseDto {
  @ApiProperty()
  today: {
    sales: TodaySalesDto;
    cashCollected: TodayCashCollectedDto;
    repairsCompleted: TodayRepairsCompletedDto;
  };
  @ApiProperty()
  financial: FinancialOverviewDto;
  @ApiProperty()
  inventory: InventoryOverviewDto;
  @ApiProperty()
  trends: OverviewTrendsDto;
}
