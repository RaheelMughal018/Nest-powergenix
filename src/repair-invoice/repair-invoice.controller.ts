import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { RepairStatus } from '@prisma/client';
import { ApiPaginatedResponse } from '../common/decorators/api-paginated-response.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CreateRepairInvoiceDto } from './dto/create-repair-invoice.dto';
import { RepairInvoiceResponseDto } from './dto/repair-invoice-response.dto';
import { UpdateRepairStatusDto } from './dto/update-repair-status.dto';
import { RepairInvoiceService } from './repair-invoice.service';

@ApiTags('Repair Invoices')
@ApiBearerAuth('JWT-auth')
@Controller('repair-invoices')
export class RepairInvoiceController {
  constructor(private readonly repairInvoiceService: RepairInvoiceService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create repair invoice',
    description:
      'FOC: no payment, no ledger. CHARGED: parts + service + bush; payment optional (UNPAID/PAID/PARTIAL). ' +
      'ACTUAL items are deducted from stock when status moves to IN_PROGRESS.',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Repair invoice created',
    type: RepairInvoiceResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid items, insufficient stock, or invalid payment data',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Customer, account, or item not found',
  })
  create(@Body() dto: CreateRepairInvoiceDto, @CurrentUser('id') adminId: number) {
    return this.repairInvoiceService.create(dto, adminId);
  }

  @Get()
  @ApiOperation({ summary: 'List repair invoices with filters' })
  @ApiPaginatedResponse(RepairInvoiceResponseDto)
  @ApiQuery({ name: 'customer_id', required: false, type: Number })
  @ApiQuery({ name: 'repair_status', enum: RepairStatus, required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  findAll(
    @Query('customer_id') customerId?: string,
    @Query('repair_status') repairStatus?: RepairStatus,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const filters: {
      customer_id?: number;
      repair_status?: RepairStatus;
      page?: number;
      limit?: number;
    } = {};
    if (customerId) filters.customer_id = parseInt(customerId, 10);
    if (repairStatus) filters.repair_status = repairStatus;
    if (page) filters.page = parseInt(page, 10);
    if (limit) filters.limit = parseInt(limit, 10);
    return this.repairInvoiceService.findAll(filters);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get repair invoice by ID' })
  @ApiResponse({ status: HttpStatus.OK, type: RepairInvoiceResponseDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Repair invoice not found' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.repairInvoiceService.findOne(id);
  }

  @Patch(':id/status')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update repair status',
    description:
      'PENDING → IN_PROGRESS (deducts ACTUAL parts from stock), IN_PROGRESS → COMPLETED, COMPLETED → DELIVERED.',
  })
  @ApiResponse({ status: HttpStatus.OK, type: RepairInvoiceResponseDto })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid status transition' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Repair invoice not found' })
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateRepairStatusDto,
    @CurrentUser('id') adminId: number,
  ) {
    return this.repairInvoiceService.updateStatus(id, dto, adminId);
  }
}
