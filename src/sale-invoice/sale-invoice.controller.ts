import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { ApiPaginatedResponse } from '../common/decorators/api-paginated-response.decorator';
import { PaymentStatus } from '@prisma/client';
import { SaleInvoiceService } from './sale-invoice.service';
import { CreateSaleInvoiceDto } from './dto/create-sale-invoice.dto';
import { SaleInvoiceResponseDto } from './dto/sale-invoice-response.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Sale Invoices')
@ApiBearerAuth('JWT-auth')
@Controller('sale-invoices')
export class SaleInvoiceController {
  constructor(private readonly saleInvoiceService: SaleInvoiceService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create sale invoice',
    description:
      'FINAL products: use item_id + serial_number (qty=1, price from ProductionItem). ' +
      'RAW items: use item_id + quantity (price from Item.avg_price). ' +
      'Stock and avg_price rules applied. PAID/PARTIAL create receipt and ledger entries.',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Sale invoice created',
    type: SaleInvoiceResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid items, insufficient stock, or invalid payment data',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Customer, account, or item not found',
  })
  create(@Body() dto: CreateSaleInvoiceDto, @CurrentUser('id') adminId: number) {
    return this.saleInvoiceService.create(dto, adminId);
  }

  @Get()
  @ApiOperation({ summary: 'List sale invoices with filters' })
  @ApiPaginatedResponse(SaleInvoiceResponseDto)
  @ApiQuery({ name: 'customer_id', required: false, type: Number })
  @ApiQuery({ name: 'payment_status', enum: PaymentStatus, required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  findAll(
    @Query('customer_id') customerId?: string,
    @Query('payment_status') paymentStatus?: PaymentStatus,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const filters: { customer_id?: number; payment_status?: PaymentStatus; page?: number; limit?: number } = {};
    if (customerId) filters.customer_id = parseInt(customerId, 10);
    if (paymentStatus) filters.payment_status = paymentStatus;
    if (page) filters.page = parseInt(page, 10);
    if (limit) filters.limit = parseInt(limit, 10);
    return this.saleInvoiceService.findAll(filters);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get sale invoice by ID' })
  @ApiResponse({ status: HttpStatus.OK, type: SaleInvoiceResponseDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Invoice not found' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.saleInvoiceService.findOne(id);
  }
}
