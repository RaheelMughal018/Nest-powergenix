import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Query,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { ApiPaginatedResponse } from '../common/decorators/api-paginated-response.decorator';
import { ReceiptService } from './receipt.service';
import { CreateReceiptDto } from './dto/create-receipt.dto';
import { ReceiptFilterDto } from './dto/receipt-filter.dto';
import { ReceiptResponseDto } from './dto/receipt-response.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Receipts')
@ApiBearerAuth('JWT-auth')
@Controller('receipts')
export class ReceiptController {
  constructor(private readonly receiptService: ReceiptService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create direct receipt',
    description:
      'Receive money from customer without an invoice (advance, settlement, etc.). ' +
      'Reduces customer balance and increases account balance. Invoice-linked receipts are created automatically when a sale invoice is PAID or PARTIAL.',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Receipt created',
    type: ReceiptResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid amount',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Customer or account not found',
  })
  create(@Body() dto: CreateReceiptDto, @CurrentUser('id') adminId: number) {
    return this.receiptService.create(dto, adminId);
  }

  @Get()
  @ApiOperation({
    summary: 'List receipts with optional filters',
    description:
      'Optionally filter by customer_id and date range using from_date and to_date query parameters (ISO 8601).',
  })
  @ApiPaginatedResponse(ReceiptResponseDto)
  findAll(@Query() filterDto: ReceiptFilterDto) {
    return this.receiptService.findAll(filterDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get receipt by ID' })
  @ApiResponse({ status: HttpStatus.OK, type: ReceiptResponseDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Receipt not found' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.receiptService.findOne(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete receipt (direct only)',
    description: 'Only direct receipts (not linked to an invoice) can be deleted. Reverses customer and account balances.',
  })
  @ApiResponse({ status: HttpStatus.OK, description: 'Receipt deleted' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Cannot delete invoice-linked receipt' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Receipt not found' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.receiptService.remove(id);
  }
}
