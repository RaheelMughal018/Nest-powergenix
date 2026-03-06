import { Module } from '@nestjs/common';
import { DashboardOverviewController } from './controllers/dashboard-overview.controller';
import { DashboardOverviewService } from './services/dashboard-overview.service';
import { DashboardHelperService } from './services/dashboard-helper.service';

@Module({
  controllers: [DashboardOverviewController],
  providers: [DashboardOverviewService, DashboardHelperService],
  exports: [DashboardOverviewService, DashboardHelperService],
})
export class DashboardModule {}
