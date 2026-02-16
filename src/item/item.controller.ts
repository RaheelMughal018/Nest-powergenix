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
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { ItemService } from './item.service';
import { CreateItemDto } from './dto/create-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';
import { AdjustStockDto } from './dto/adjust-stock.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { ApiPaginatedResponse } from '../common/decorators/api-paginated-response.decorator';
import { ItemResponseDto } from './dto/item-response.dto';
import { StockInfoResponseDto } from './dto/stock-info-response.dto';
import { StockAdjustmentResponseDto } from './dto/stock-adjustment-response.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ItemType } from '@prisma/client';
import { ItemFilterDto } from './dto/item-filter.dto';

@ApiTags('Items')
@ApiBearerAuth('JWT-auth')
@Controller('items')
export class ItemController {
  constructor(private readonly itemService: ItemService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new item WITHOUT stock (quantity=0, avg_price=0)' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Item successfully created without stock. Use adjust-stock endpoint to add stock.',
    type: ItemResponseDto,
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid input data' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Category not found' })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: 'Item name already exists in category' })
  create(@Body() createItemDto: CreateItemDto) {
    return this.itemService.create(createItemDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all items with filters and pagination' })
  @ApiQuery({ name: 'search', required: false, description: 'Search by item name' })
  @ApiQuery({
    name: 'item_type',
    enum: ItemType,
    required: false,
    description: 'Filter by item type (RAW or FINAL)',
  })
  @ApiQuery({
    name: 'category_id',
    type: Number,
    required: false,
    description: 'Filter by category ID',
  })
  @ApiQuery({
    name: 'stock_status',
    enum: ['in_stock', 'out_of_stock'],
    required: false,
    description: 'Filter by stock status',
  })
  @ApiPaginatedResponse(ItemResponseDto)
  findAll(@Query() itemFilterDto: ItemFilterDto) {
    return this.itemService.findAll(itemFilterDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get item by ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Item found',
    type: ItemResponseDto,
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Item not found' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.itemService.findOne(id);
  }

  @Get(':id/stock')
  @ApiOperation({ summary: 'Get current stock information for an item' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Stock information retrieved successfully',
    type: StockInfoResponseDto,
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Item not found' })
  getStockInfo(@Param('id', ParseIntPipe) id: number) {
    return this.itemService.getStockInfo(id);
  }

  @Get(':id/stock-history')
  @ApiOperation({ summary: 'Get stock adjustment history with pagination' })
  @ApiPaginatedResponse(StockAdjustmentResponseDto)
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Item not found' })
  getStockHistory(@Param('id', ParseIntPipe) id: number, @Query() paginationDto: PaginationDto) {
    return this.itemService.getStockHistory(id, paginationDto);
  }

  @Post(':id/adjust-stock')
  @ApiOperation({
    summary: 'Manually adjust stock (add/remove) with automatic weighted average price calculation',
    description:
      'This is the ONLY way to modify stock manually. When adding stock (quantity > 0), the average price is calculated using weighted average. When removing stock (quantity < 0), the average price remains unchanged.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Stock adjusted successfully',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid adjustment data or insufficient stock',
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Item not found' })
  adjustStock(
    @Param('id', ParseIntPipe) id: number,
    @Body() adjustStockDto: AdjustStockDto,
    @CurrentUser('id') userId: number,
  ) {
    return this.itemService.adjustStock(id, adjustStockDto, userId);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update item details (name, category_id ONLY - NOT quantity, avg_price, or item_type)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Item successfully updated',
    type: ItemResponseDto,
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Item or category not found' })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: 'Item name already exists in category' })
  update(@Param('id', ParseIntPipe) id: number, @Body() updateItemDto: UpdateItemDto) {
    return this.itemService.update(id, updateItemDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete item',
    description: 'Can only delete if quantity=0 AND no stock adjustment history exists',
  })
  @ApiResponse({ status: HttpStatus.OK, description: 'Item successfully deleted' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Item not found' })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: 'Item has stock or adjustment history' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.itemService.remove(id);
  }
}
