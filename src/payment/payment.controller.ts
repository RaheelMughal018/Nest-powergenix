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
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiParam } from '@nestjs/swagger';
import { PaymentService } from './payment.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { PaymentFilterDto } from './dto/payment-filter.dto';
import { PaymentResponseDto } from './dto/payment-response.dto';
import { ApiPaginatedResponse } from '../common/decorators/api-paginated-response.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Payments')
@ApiBearerAuth('JWT-auth')
@Controller('payments')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a direct payment to supplier',
    description:
      'Make a direct payment to supplier (not linked to any invoice). ' +
      'This reduces supplier outstanding balance and account balance. ' +
      'Automatically creates ledger entries for both supplier and account.',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Payment created successfully',
    type: PaymentResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data or payment exceeds outstanding balance',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Supplier or account not found',
  })
  create(
    @Body() createDto: CreatePaymentDto,
    @CurrentUser('id') adminId: number,
  ): Promise<PaymentResponseDto> {
    return this.paymentService.create(createDto, adminId);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get paginated list of payments',
    description: 'Retrieve all payments (both direct and invoice payments) with optional filters',
  })
  @ApiPaginatedResponse(PaymentResponseDto)
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid query parameters',
  })
  findAll(@Query() filterDto: PaymentFilterDto) {
    return this.paymentService.findAll(filterDto);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get payment details by ID',
    description:
      'Retrieve complete details of a payment including supplier, account, and invoice info',
  })
  @ApiParam({
    name: 'id',
    description: 'Payment ID',
    type: Number,
    example: 1,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Payment details retrieved successfully',
    type: PaymentResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Payment not found',
  })
  findOne(@Param('id', ParseIntPipe) id: number): Promise<PaymentResponseDto> {
    return this.paymentService.findOne(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete a direct payment (RESTRICTED)',
    description:
      'Delete direct payment only (not linked to invoice). ' +
      'Automatically reverses supplier balance, account balance, and ledger entries. ' +
      'Cannot delete payments linked to invoices.',
  })
  @ApiParam({
    name: 'id',
    description: 'Payment ID',
    type: Number,
    example: 1,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Payment deleted successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Payment deleted successfully' },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Payment not found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Cannot delete payment linked to invoice',
  })
  remove(@Param('id', ParseIntPipe) id: number): Promise<{ message: string }> {
    return this.paymentService.remove(id);
  }
}
