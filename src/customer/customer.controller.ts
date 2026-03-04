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
import { CustomerService } from './customer.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { CustomerResponseDto } from './dto/customer-response.dto';
import { CustomerStatementDto } from './dto/customer-statement.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { ApiPaginatedResponse } from '../common/decorators/api-paginated-response.decorator';

@ApiTags('Customers')
@ApiBearerAuth('JWT-auth')
@Controller('customers')
export class CustomerController {
  constructor(private readonly customerService: CustomerService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new customer' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Customer successfully created',
    type: CustomerResponseDto,
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid input data' })
  create(@Body() createCustomerDto: CreateCustomerDto) {
    return this.customerService.create(createCustomerDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all customers with pagination' })
  @ApiPaginatedResponse(CustomerResponseDto)
  findAll(@Query() paginationDto: PaginationDto) {
    return this.customerService.findAll(paginationDto);
  }

  @Get(':id/statement')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get customer statement with optional date range',
    description:
      'Get complete customer statement including all sale invoices, receipts, and outstanding balance. ' +
      'Optionally filter by date range using from_date and to_date query parameters.',
  })
  @ApiParam({
    name: 'id',
    description: 'Customer ID',
    type: Number,
    example: 1,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Customer statement retrieved successfully',
    type: CustomerStatementDto,
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Customer not found' })
  getStatement(
    @Param('id', ParseIntPipe) id: number,
    @Query('from_date') fromDate?: string,
    @Query('to_date') toDate?: string,
  ): Promise<CustomerStatementDto> {
    return this.customerService.getStatement(id, fromDate, toDate);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get customer by ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Customer found',
    type: CustomerResponseDto,
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Customer not found' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.customerService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update customer' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Customer successfully updated',
    type: CustomerResponseDto,
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Customer not found' })
  update(@Param('id', ParseIntPipe) id: number, @Body() updateCustomerDto: UpdateCustomerDto) {
    return this.customerService.update(id, updateCustomerDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete customer' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Customer successfully deleted' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Customer not found' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.customerService.remove(id);
  }
}
