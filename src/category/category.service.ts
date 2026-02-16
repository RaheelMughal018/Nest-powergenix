import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../common/database/prisma.service';
import { LoggerService } from '../common/logger/logger.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { PaginatedResponseDto } from '../common/dto/pagination-response.dto';
import { PaginationUtil } from '../common/utils/pagination.util';
import { Prisma } from '@prisma/client';

@Injectable()
export class CategoryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: LoggerService,
  ) {
    this.logger.setContext('CategoryService');
  }

  async create(createCategoryDto: CreateCategoryDto) {
    const trimmedName = createCategoryDto.name.trim();
    
    // Case-insensitive uniqueness check
    const existingCategory = await this.prisma.category.findFirst({
      where: {
        name: {
          equals: trimmedName,
          mode: 'insensitive',
        },
      },
    });

    if (existingCategory) {
      throw new ConflictException(`Category with name "${trimmedName}" already exists`);
    }

    const category = await this.prisma.category.create({
      data: {
        name: trimmedName,
      },
    });

    this.logger.log(`Created category: ${category.name}`);
    return category;
  }

  async findAll(paginationDto: PaginationDto): Promise<PaginatedResponseDto<any>> {
    const { page = 1, limit = 10, search, sortBy = 'name', sortOrder = 'asc' } = paginationDto;

    const skip = PaginationUtil.getSkip(page, limit);
    const orderBy = PaginationUtil.buildOrderBy(sortBy, sortOrder);

    // Build search conditions
    const where = PaginationUtil.buildSearchWhere(search, ['name']);

    const [categories, total] = await Promise.all([
      this.prisma.category.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          _count: {
            select: { items: true },
          },
        },
      }),
      this.prisma.category.count({ where }),
    ]);

    return PaginationUtil.createPaginatedResponse(categories, total, paginationDto);
  }

  async findOne(id: number) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: { items: true },
        },
      },
    });

    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    return category;
  }

  async update(id: number, updateCategoryDto: UpdateCategoryDto) {
    const category = await this.findOne(id); // Check if exists

    if (updateCategoryDto.name) {
      const trimmedName = updateCategoryDto.name.trim();

      // Case-insensitive uniqueness check (excluding current category)
      const existingCategory = await this.prisma.category.findFirst({
        where: {
          name: {
            equals: trimmedName,
            mode: 'insensitive',
          },
          id: {
            not: id,
          },
        },
      });

      if (existingCategory) {
        throw new ConflictException(`Category with name "${trimmedName}" already exists`);
      }

      const updatedCategory = await this.prisma.category.update({
        where: { id },
        data: {
          name: trimmedName,
        },
      });

      this.logger.log(`Updated category: ${updatedCategory.name}`);
      return updatedCategory;
    }

    return category;
  }

  async remove(id: number) {
    const category = await this.findOne(id); // Check if exists and get item count

    // Check if category has any items
    const itemCount = category._count.items;
    if (itemCount > 0) {
      throw new ConflictException(
        `Cannot delete category '${category.name}' because it has ${itemCount} item(s) associated with it. Please reassign or delete the items first.`,
      );
    }

    await this.prisma.category.delete({
      where: { id },
    });

    this.logger.log(`Deleted category: ${category.name}`);
    return { message: 'Category deleted successfully' };
  }
}
