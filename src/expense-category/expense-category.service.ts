import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../common/database/prisma.service';
import { LoggerService } from '../common/logger/logger.service';
import { CreateExpenseCategoryDto } from './dto/create-expense-category.dto';
import { UpdateExpenseCategoryDto } from './dto/update-expense-category.dto';

@Injectable()
export class ExpenseCategoryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: LoggerService,
  ) {
    this.logger.setContext('ExpenseCategoryService');
  }

  async create(dto: CreateExpenseCategoryDto) {
    const name = dto.name.trim();
    const existing = await this.prisma.expenseCategory.findFirst({
      where: { name: { equals: name, mode: 'insensitive' } },
    });
    if (existing) {
      throw new ConflictException(`Expense category "${name}" already exists`);
    }
    const category = await this.prisma.expenseCategory.create({
      data: {
        name,
        description: dto.description?.trim() ?? null,
      },
    });
    this.logger.log(`Created expense category: ${category.name}`);
    return category;
  }

  async findAll() {
    return this.prisma.expenseCategory.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { expenses: true } } },
    });
  }

  async findOne(id: number) {
    const category = await this.prisma.expenseCategory.findUnique({
      where: { id },
      include: { _count: { select: { expenses: true } } },
    });
    if (!category) {
      throw new NotFoundException(`Expense category with ID ${id} not found`);
    }
    return category;
  }

  async update(id: number, dto: UpdateExpenseCategoryDto) {
    await this.findOne(id);
    const updates: { name?: string; description?: string | null } = {};
    if (dto.name !== undefined) {
      const name = dto.name.trim();
      const existing = await this.prisma.expenseCategory.findFirst({
        where: {
          name: { equals: name, mode: 'insensitive' },
          id: { not: id },
        },
      });
      if (existing) {
        throw new ConflictException(`Expense category "${name}" already exists`);
      }
      updates.name = name;
    }
    if (dto.description !== undefined) {
      updates.description = dto.description?.trim() ?? null;
    }
    const category = await this.prisma.expenseCategory.update({
      where: { id },
      data: updates,
    });
    this.logger.log(`Updated expense category: ${category.name}`);
    return category;
  }

  async remove(id: number) {
    const category = await this.findOne(id);
    if (category._count.expenses > 0) {
      throw new ConflictException(
        `Cannot delete category "${category.name}" because it has ${category._count.expenses} expense(s).`,
      );
    }
    await this.prisma.expenseCategory.delete({ where: { id } });
    this.logger.log(`Deleted expense category: ${category.name}`);
    return { message: 'Expense category deleted successfully' };
  }
}
