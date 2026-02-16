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
import { SupplierService } from './supplier.service';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { ApiPaginatedResponse } from '../common/decorators/api-paginated-response.decorator';
import { SupplierResponseDto } from './dto/supplier-response.dto';
import { SupplierStatementDto } from './dto/supplier-statement.dto';

@ApiTags('Suppliers')
@ApiBearerAuth('JWT-auth')
@Controller('suppliers')
export class SupplierController {
  constructor(private readonly supplierService: SupplierService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new supplier' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Supplier successfully created',
    type: SupplierResponseDto,
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid input data' })
  create(@Body() createSupplierDto: CreateSupplierDto) {
    return this.supplierService.create(createSupplierDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all suppliers with pagination' })
  @ApiPaginatedResponse(SupplierResponseDto)
  findAll(@Query() paginationDto: PaginationDto) {
    return this.supplierService.findAll(paginationDto);
  }

  @Get(':id/statement')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get supplier statement',
    description:
      'Get complete supplier statement including all purchase invoices, payments, and outstanding balance',
  })
  @ApiParam({
    name: 'id',
    description: 'Supplier ID',
    type: Number,
    example: 1,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Supplier statement retrieved successfully',
    type: SupplierStatementDto,
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Supplier not found' })
  getStatement(@Param('id', ParseIntPipe) id: number): Promise<SupplierStatementDto> {
    return this.supplierService.getStatement(id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get supplier by ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Supplier found',
    type: SupplierResponseDto,
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Supplier not found' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.supplierService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update supplier' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Supplier successfully updated',
    type: SupplierResponseDto,
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Supplier not found' })
  update(@Param('id', ParseIntPipe) id: number, @Body() updateSupplierDto: UpdateSupplierDto) {
    return this.supplierService.update(id, updateSupplierDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete supplier' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Supplier successfully deleted' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Supplier not found' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.supplierService.remove(id);
  }
}
