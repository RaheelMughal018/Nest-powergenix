import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiParam } from '@nestjs/swagger';
import { PurchaseInvoiceService } from './purchase-invoice.service';
import { CreatePurchaseInvoiceDto } from './dto/create-purchase-invoice.dto';
import { UpdatePurchaseInvoiceDto } from './dto/update-purchase-invoice.dto';
import { PurchaseInvoiceFilterDto } from './dto/purchase-invoice-filter.dto';
import { PurchaseInvoiceResponseDto } from './dto/purchase-invoice-response.dto';
import { PurchaseInvoiceSummaryDto } from './dto/purchase-invoice-summary.dto';
import { ApiPaginatedResponse } from '../common/decorators/api-paginated-response.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Purchase Invoices')
@ApiBearerAuth('JWT-auth')
@Controller('purchase-invoices')
export class PurchaseInvoiceController {
  constructor(private readonly purchaseInvoiceService: PurchaseInvoiceService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a new purchase invoice',
    description:
      'Creates a purchase invoice with automatic stock updates, weighted average calculation, ' +
      'supplier balance updates, ledger entries, and optional payment processing.',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Purchase invoice created successfully',
    type: PurchaseInvoiceResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data or validation failed',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Supplier, account, or item not found',
  })
  create(
    @Body() createDto: CreatePurchaseInvoiceDto,
    @CurrentUser('id') adminId: number,
  ): Promise<PurchaseInvoiceResponseDto> {
    return this.purchaseInvoiceService.create(createDto, adminId);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get paginated list of purchase invoices',
    description:
      'Retrieve purchase invoices with optional filters for supplier, payment status, and date range',
  })
  @ApiPaginatedResponse(PurchaseInvoiceResponseDto)
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid query parameters',
  })
  findAll(@Query() filterDto: PurchaseInvoiceFilterDto) {
    return this.purchaseInvoiceService.findAll(filterDto);
  }

  @Get('summary')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get purchase invoices summary',
    description:
      'Get statistical summary of all purchase invoices including totals, counts by status, and outstanding amounts',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Summary retrieved successfully',
    type: PurchaseInvoiceSummaryDto,
  })
  getSummary(): Promise<PurchaseInvoiceSummaryDto> {
    return this.purchaseInvoiceService.getSummary();
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get purchase invoice details by ID',
    description:
      'Retrieve complete details of a purchase invoice including all items, supplier info, and payment status',
  })
  @ApiParam({
    name: 'id',
    description: 'Purchase invoice ID',
    type: Number,
    example: 1,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Invoice details retrieved successfully',
    type: PurchaseInvoiceResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Purchase invoice not found',
  })
  findOne(@Param('id', ParseIntPipe) id: number): Promise<PurchaseInvoiceResponseDto> {
    return this.purchaseInvoiceService.findOne(id);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update a purchase invoice (RESTRICTED)',
    description:
      'Update invoice only if payment_status is UNPAID and no payments have been made. ' +
      'Cannot change supplier or invoice_date. Stock adjustments are automatically recalculated.',
  })
  @ApiParam({
    name: 'id',
    description: 'Purchase invoice ID',
    type: Number,
    example: 1,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Invoice updated successfully',
    type: PurchaseInvoiceResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Purchase invoice or items not found',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Cannot update invoice that is not UNPAID or has payments',
  })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdatePurchaseInvoiceDto,
    @CurrentUser('id') adminId: number,
  ): Promise<PurchaseInvoiceResponseDto> {
    return this.purchaseInvoiceService.update(id, updateDto, adminId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete a purchase invoice (VERY RESTRICTED)',
    description:
      'Delete invoice only if no payments have been made. ' +
      'Automatically reverses all stock adjustments, supplier balance, and ledger entries.',
  })
  @ApiParam({
    name: 'id',
    description: 'Purchase invoice ID',
    type: Number,
    example: 1,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Invoice deleted successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Purchase invoice deleted successfully' },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Purchase invoice not found',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Cannot delete invoice that has payments',
  })
  remove(@Param('id', ParseIntPipe) id: number): Promise<{ message: string }> {
    return this.purchaseInvoiceService.remove(id);
  }
}
