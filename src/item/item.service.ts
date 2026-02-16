import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../common/database/prisma.service';
import { LoggerService } from '../common/logger/logger.service';
import { CategoryService } from '../category/category.service';
import { CreateItemDto } from './dto/create-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';
import { AdjustStockDto } from './dto/adjust-stock.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { PaginatedResponseDto } from '../common/dto/pagination-response.dto';
import { PaginationUtil } from '../common/utils/pagination.util';
import { ItemType, Prisma } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { ItemResponseDto } from './dto/item-response.dto';
import { ItemFilterDto } from './dto/item-filter.dto';

@Injectable()
export class ItemService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly categoryService: CategoryService,
    private readonly logger: LoggerService,
  ) {
    this.logger.setContext('ItemService');
  }

  /**
   * Create a new item WITHOUT stock
   * Items always start with quantity=0 and avg_price=0
   */
  async create(createItemDto: CreateItemDto) {
    const trimmedName = createItemDto.name.trim();

    // 1. Verify category exists
    await this.categoryService.findOne(createItemDto.category_id);

    // 2. Case-insensitive uniqueness check within category
    const existingItem = await this.prisma.item.findFirst({
      where: {
        category_id: createItemDto.category_id,
        name: {
          equals: trimmedName,
          mode: 'insensitive',
        },
      },
    });

    if (existingItem) {
      throw new ConflictException(
        `Item with name "${trimmedName}" already exists in this category`,
      );
    }

    // 3. Create item with ZERO stock (stock is added later via adjustStock)
    const item = await this.prisma.item.create({
      data: {
        name: trimmedName,
        item_type: createItemDto.item_type,
        category_id: createItemDto.category_id,
        quantity: 0,
        avg_price: 0,
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    this.logger.log(
      `Created item: ${item.name} (${item.item_type}) in category ${item.category.name}`,
    );
    return item;
  }

  /**
   * Get all items with filters and pagination
   */
  async findAll(paginationDto: ItemFilterDto): Promise<PaginatedResponseDto<ItemResponseDto>> {
    const {
      page = 1,
      limit = 10,
      search,
      sortBy = 'created_at',
      sortOrder,
      item_type,
      category_id,
      stock_status,
    } = paginationDto;

    const skip = PaginationUtil.getSkip(page, limit);
    const orderBy = PaginationUtil.buildOrderBy(sortBy, sortOrder);

    // Build where clause with filters
    const where: Prisma.ItemWhereInput = {};
    console.log('🚀 ~ ItemService ~ findAll ~ where:', where);

    // Search by name
    if (search) {
      where.name = {
        contains: search,
        mode: 'insensitive',
      };
    }

    // Filter by item type
    if (item_type) {
      where.item_type = item_type;
    }

    // Filter by category
    if (category_id) {
      where.category_id = category_id;
    }

    // Filter by stock status
    if (stock_status) {
      if (stock_status === 'in_stock') {
        where.quantity = { gt: 0 };
      } else if (stock_status === 'out_of_stock') {
        where.quantity = { equals: 0 };
      }
    }

    const [items, total] = await Promise.all([
      this.prisma.item.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          category: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
      this.prisma.item.count({ where }),
    ]);

    return PaginationUtil.createPaginatedResponse(items, total, paginationDto);
  }

  /**
   * Get single item by ID
   */
  async findOne(id: number) {
    const item = await this.prisma.item.findUnique({
      where: { id },
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!item) {
      throw new NotFoundException(`Item with ID ${id} not found`);
    }

    return item;
  }

  /**
   * Update item details (name, category_id ONLY - NOT quantity, avg_price, or item_type)
   */
  async update(id: number, updateItemDto: UpdateItemDto) {
    const item = await this.findOne(id); // Check if exists

    // If name is being updated, check uniqueness within category
    if (updateItemDto.name) {
      const trimmedName = updateItemDto.name.trim();
      const categoryId = updateItemDto.category_id || item.category_id;

      const existingItem = await this.prisma.item.findFirst({
        where: {
          category_id: categoryId,
          name: {
            equals: trimmedName,
            mode: 'insensitive',
          },
          id: {
            not: id,
          },
        },
      });

      if (existingItem) {
        throw new ConflictException(
          `Item with name "${trimmedName}" already exists in this category`,
        );
      }
    }

    // If category_id is being updated, verify it exists
    if (updateItemDto.category_id && updateItemDto.category_id !== item.category_id) {
      await this.categoryService.findOne(updateItemDto.category_id);

      // Check if item name exists in new category
      const existingItem = await this.prisma.item.findFirst({
        where: {
          category_id: updateItemDto.category_id,
          name: {
            equals: updateItemDto.name?.trim() || item.name,
            mode: 'insensitive',
          },
        },
      });

      if (existingItem) {
        throw new ConflictException(
          `Item with name "${updateItemDto.name?.trim() || item.name}" already exists in the target category`,
        );
      }
    }

    const updatedItem = await this.prisma.item.update({
      where: { id },
      data: {
        name: updateItemDto.name?.trim(),
        category_id: updateItemDto.category_id,
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    this.logger.log(`Updated item: ${updatedItem.name}`);
    return updatedItem;
  }

  /**
   * Delete item ONLY if quantity=0 AND no stock adjustment history
   */
  async remove(id: number) {
    const item = await this.findOne(id); // Check if exists

    // Check if item has stock
    const quantity = new Decimal(item.quantity.toString());
    if (quantity.greaterThan(0)) {
      throw new ConflictException(
        `Cannot delete item '${item.name}' because it has ${item.quantity} units in stock. Please remove all stock first.`,
      );
    }

    // Check if item has stock adjustment history
    const adjustmentCount = await this.prisma.stockAdjustment.count({
      where: { item_id: id },
    });

    if (adjustmentCount > 0) {
      throw new ConflictException(
        `Cannot delete item '${item.name}' because it has stock adjustment history (${adjustmentCount} record(s)). Items with history cannot be deleted.`,
      );
    }

    await this.prisma.item.delete({
      where: { id },
    });

    this.logger.log(`Deleted item: ${item.name}`);
    return { message: 'Item deleted successfully' };
  }

  /**
   * Get current stock information for an item
   */
  async getStockInfo(id: number) {
    const item = await this.findOne(id);

    const quantity = new Decimal(item.quantity.toString());
    const avgPrice = new Decimal(item.avg_price.toString());
    const totalValue = quantity.mul(avgPrice);

    return {
      item_id: item.id,
      item_name: item.name,
      quantity: item.quantity,
      avg_price: item.avg_price,
      total_value: totalValue,
      item_type: item.item_type,
      category_name: item.category.name,
    };
  }

  /**
   * Manually adjust stock with automatic weighted average price calculation
   * This is the ONLY way to modify stock (besides purchase invoices in future)
   */
  async adjustStock(id: number, adjustStockDto: AdjustStockDto, userId: number) {
    const item = await this.findOne(id);

    const { quantity: adjustmentQty, unit_price, reason, notes } = adjustStockDto;

    // Validation: Cannot adjust by 0
    if (adjustmentQty === 0) {
      throw new BadRequestException('Adjustment quantity cannot be zero');
    }

    // Validation: Unit price required when adding stock
    if (adjustmentQty > 0 && unit_price <= 0) {
      throw new BadRequestException('Unit price must be greater than 0 when adding stock');
    }

    // Validation: Cannot remove more than available
    const currentQty = new Decimal(item.quantity.toString());
    const newQty = currentQty.plus(adjustmentQty);

    if (newQty.lessThan(0)) {
      throw new BadRequestException(
        `Cannot remove ${Math.abs(adjustmentQty)} units. Only ${currentQty} units available in stock.`,
      );
    }

    // Calculate new average price using weighted average formula
    let newAvgPrice: Decimal;

    if (adjustmentQty > 0) {
      // ADDING STOCK: Calculate weighted average
      // new_avg_price = (old_qty × old_avg_price + new_qty × unit_price) / (old_qty + new_qty)
      const oldAvgPrice = new Decimal(item.avg_price.toString());
      const oldValue = currentQty.mul(oldAvgPrice);
      const newValue = new Decimal(adjustmentQty).mul(unit_price);
      const totalValue = oldValue.plus(newValue);

      newAvgPrice = newQty.greaterThan(0) ? totalValue.div(newQty) : new Decimal(0);
    } else {
      // REMOVING STOCK: Keep the same average price
      newAvgPrice = new Decimal(item.avg_price.toString());

      // Special case: If stock reaches zero, reset avg_price to 0
      if (newQty.equals(0)) {
        newAvgPrice = new Decimal(0);
      }
    }

    // Update item and create stock adjustment record in a transaction
    const result = await this.prisma.$transaction(async (tx) => {
      // Update item
      const updatedItem = await tx.item.update({
        where: { id },
        data: {
          quantity: newQty.toNumber(),
          avg_price: newAvgPrice.toNumber(),
        },
        include: {
          category: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      // Create stock adjustment record
      const adjustment = await tx.stockAdjustment.create({
        data: {
          item_id: id,
          admin_id: userId,
          quantity: adjustmentQty,
          avg_price: newAvgPrice.toNumber(),
          reason,
          notes,
        },
        include: {
          admin: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      return { item: updatedItem, adjustment };
    });

    this.logger.log(
      `Stock adjusted for item ${item.name}: ${adjustmentQty > 0 ? '+' : ''}${adjustmentQty} units (Reason: ${reason})`,
    );

    return result;
  }

  /**
   * Get stock adjustment history with pagination
   */
  async getStockHistory(
    id: number,
    paginationDto: PaginationDto,
  ): Promise<PaginatedResponseDto<any>> {
    await this.findOne(id); // Verify item exists

    const { page = 1, limit = 10, sortBy = 'adjustment_date', sortOrder = 'desc' } = paginationDto;

    const skip = PaginationUtil.getSkip(page, limit);
    const orderBy = PaginationUtil.buildOrderBy(sortBy, sortOrder);

    const [adjustments, total] = await Promise.all([
      this.prisma.stockAdjustment.findMany({
        where: { item_id: id },
        skip,
        take: limit,
        orderBy,
        include: {
          admin: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
      this.prisma.stockAdjustment.count({ where: { item_id: id } }),
    ]);

    // Map to include admin_name
    const mappedAdjustments = adjustments.map((adj) => ({
      ...adj,
      admin_name: adj.admin.name,
    }));

    return PaginationUtil.createPaginatedResponse(mappedAdjustments, total, paginationDto);
  }
}
