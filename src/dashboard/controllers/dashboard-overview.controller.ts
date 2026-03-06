import { Controller, Get, HttpStatus, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { DashboardOverviewService } from '../services/dashboard-overview.service';
import { OverviewDashboardResponseDto } from '../dto/overview-dashboard.dto';
import { OverviewQueryDto } from '../dto/overview-query.dto';

@ApiTags('Dashboard')
@ApiBearerAuth('JWT-auth')
@Controller('dashboard')
export class DashboardOverviewController {
  constructor(private readonly overviewService: DashboardOverviewService) {}

  @Get('overview')
  @ApiOperation({
    summary: 'Get overview dashboard',
    description:
      'Optional query: date (YYYY-MM-DD) for "today" metrics, days (1–90) for trends length. Defaults: current date, 7 days.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Overview dashboard data',
    type: OverviewDashboardResponseDto,
  })
  async getOverview(
    @Query() query: OverviewQueryDto,
  ): Promise<OverviewDashboardResponseDto> {
    return this.overviewService.getOverview({
      date: query.date,
      days: query.days,
    });
  }
}
