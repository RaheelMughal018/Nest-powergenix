import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../common/database/prisma.service';
import { LoggerService } from '../common/logger/logger.service';
import { CreateProductionDto } from './dto/create-production.dto';
import { UpdateProductionDto } from './dto/update-production.dto';
import { ProductionIngredientDto } from './dto/production-ingredient.dto';
import { ProductionStatus } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class ProductionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: LoggerService,
  ) {
    this.logger.setContext('ProductionService');
  }

  /**
   * Create production in DRAFT. Copies recipe ingredients to production_ingredients (Rule 2).
   */
  async create(dto: CreateProductionDto, adminId: number) {
    const recipe = await this.prisma.recipe.findUnique({
      where: { id: dto.recipe_id },
      include: {
        final_product: { select: { id: true, name: true, item_type: true } },
        ingredients: { include: { item: { select: { id: true, name: true } } } },
      },
    });
    if (!recipe) {
      throw new NotFoundException(`Recipe with ID ${dto.recipe_id} not found`);
    }

    const existingBatch = await this.prisma.production.findUnique({
      where: { batch_number: dto.batch_number.trim() },
    });
    if (existingBatch) {
      throw new ConflictException(`Batch number "${dto.batch_number}" already exists`);
    }

    const production = await this.prisma.$transaction(async (tx) => {
      const prod = await tx.production.create({
        data: {
          batch_number: dto.batch_number.trim(),
          recipe_id: dto.recipe_id,
          admin_id: adminId,
          quantity: dto.quantity,
          status: ProductionStatus.DRAFT,
          notes: dto.notes?.trim() ?? null,
        },
      });
      for (const ing of recipe.ingredients) {
        await tx.productionIngredient.create({
          data: {
            production_id: prod.id,
            item_id: ing.item_id,
            quantity: ing.quantity,
            is_from_recipe: true,
          },
        });
      }
      return prod;
    });

    this.logger.log(`Created production batch ${production.batch_number} (DRAFT)`);
    return this.findOne(production.id);
  }

  async findAll(status?: ProductionStatus) {
    const where = status ? { status } : {};
    return this.prisma.production.findMany({
      where,
      include: {
        recipe: {
          include: {
            final_product: {
              select: { id: true, name: true, quantity: true, avg_price: true },
            },
          },
        },
        admin: { select: { id: true, name: true } },
        production_ingredients: {
          include: {
            item: { select: { id: true, name: true, quantity: true, avg_price: true } },
          },
        },
        production_items: true,
      },
      orderBy: { id: 'desc' },
    });
  }

  async findOne(id: number) {
    const production = await this.prisma.production.findUnique({
      where: { id },
      include: {
        recipe: {
          include: {
            final_product: {
              select: { id: true, name: true, quantity: true, avg_price: true, item_type: true },
            },
          },
        },
        admin: { select: { id: true, name: true } },
        production_ingredients: {
          include: {
            item: { select: { id: true, name: true, quantity: true, avg_price: true } },
          },
        },
        production_items: true,
      },
    });
    if (!production) {
      throw new NotFoundException(`Production with ID ${id} not found`);
    }
    return production;
  }

  async update(id: number, dto: UpdateProductionDto) {
    const production = await this.findOne(id);
    if (production.status !== ProductionStatus.DRAFT) {
      throw new BadRequestException('Only DRAFT productions can be updated (notes)');
    }
    await this.prisma.production.update({
      where: { id },
      data: {
        ...(dto.notes !== undefined && { notes: dto.notes.trim() }),
      },
    });
    return this.findOne(id);
  }

  /**
   * Feasibility check using ProductionIngredient. required = ingredient.quantity × production.quantity.
   */
  async getFeasibility(id: number) {
    const production = await this.findOne(id);
    const qty = production.quantity;
    const ingredients = production.production_ingredients;
    const result: {
      canProduce: boolean;
      ingredients: Array<{
        item_id: number;
        item_name: string;
        required: number;
        available: number;
        sufficient: boolean;
        shortage: number;
        current_avg_price: number;
        estimated_cost: number;
      }>;
      estimated_cost_per_unit: number;
      estimated_total_cost: number;
      total_sufficient: number;
      total_insufficient: number;
      suggestions: string[];
    } = {
      canProduce: true,
      ingredients: [],
      estimated_cost_per_unit: 0,
      estimated_total_cost: 0,
      total_sufficient: 0,
      total_insufficient: 0,
      suggestions: [],
    };

    let costPerUnit = new Decimal(0);
    for (const pi of ingredients) {
      const required = new Decimal(pi.quantity.toString()).mul(qty).toNumber();
      const available = Number(pi.item.quantity);
      const sufficient = available >= required;
      const shortage = sufficient ? 0 : required - available;
      const lineCost = new Decimal(pi.quantity.toString())
        .mul(pi.item.avg_price.toString())
        .toNumber();
      costPerUnit = costPerUnit.add(lineCost);
      result.ingredients.push({
        item_id: pi.item.id,
        item_name: pi.item.name,
        required,
        available,
        sufficient,
        shortage,
        current_avg_price: Number(pi.item.avg_price),
        estimated_cost: lineCost * qty,
      });
      if (sufficient) result.total_sufficient++;
      else {
        result.total_insufficient++;
        result.canProduce = false;
        result.suggestions.push(
          `Purchase ${shortage} more unit(s) of '${pi.item.name}' via Purchase Invoice or Stock Adjustment`,
        );
      }
    }
    result.estimated_cost_per_unit = costPerUnit.toNumber();
    result.estimated_total_cost = costPerUnit.mul(qty).toNumber();
    return result;
  }

  /**
   * Update production ingredients for this batch only. Allowed in DRAFT or IN_PROCESS.
   */
  async updateIngredients(id: number, ingredients: ProductionIngredientDto[]) {
    const production = await this.findOne(id);
    if (production.status === ProductionStatus.DONE) {
      throw new BadRequestException('Cannot modify ingredients when production is DONE');
    }

    const itemIds = ingredients.map((i) => i.item_id);
    const uniqueIds = [...new Set(itemIds)];
    if (uniqueIds.length !== itemIds.length) {
      throw new BadRequestException('Duplicate item_id in ingredients');
    }
    const finalProductId = production.recipe.final_product.id;
    if (uniqueIds.includes(finalProductId)) {
      throw new BadRequestException('Final product cannot be an ingredient');
    }
    const itemsExist = await this.prisma.item.findMany({
      where: { id: { in: uniqueIds } },
      select: { id: true },
    });
    if (itemsExist.length !== uniqueIds.length) {
      throw new BadRequestException('One or more item IDs do not exist');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.productionIngredient.deleteMany({ where: { production_id: id } });
      for (const ing of ingredients) {
        await tx.productionIngredient.create({
          data: {
            production_id: id,
            item_id: ing.item_id,
            quantity: ing.quantity,
            is_from_recipe: false,
          },
        });
      }
    });
    this.logger.log(`Updated production ${production.batch_number} ingredients (batch-only)`);
    return this.findOne(id);
  }

  /**
   * DRAFT → IN_PROCESS. Re-run feasibility; deduct raw materials; set start_date.
   */
  async start(id: number) {
    const production = await this.findOne(id);
    if (production.status !== ProductionStatus.DRAFT) {
      throw new BadRequestException(
        `Production must be DRAFT to start. Current status: ${production.status}`,
      );
    }
    if (production.production_ingredients.length === 0) {
      throw new BadRequestException('Add at least one ingredient before starting production');
    }

    const feasibility = await this.getFeasibility(id);
    if (!feasibility.canProduce) {
      throw new BadRequestException({
        message: 'Insufficient stock to start production',
        ...feasibility,
      });
    }

    const qty = production.quantity;
    const batchNumber = production.batch_number;
    const ingredients = await this.prisma.productionIngredient.findMany({
      where: { production_id: id },
      include: { item: { select: { id: true, quantity: true, avg_price: true } } },
    });

    await this.prisma.$transaction(async (tx) => {
      for (const pi of ingredients) {
        const deductQty = new Decimal(pi.quantity.toString()).mul(qty);
        const item = await tx.item.findUnique({
          where: { id: pi.item_id },
          select: { quantity: true, avg_price: true },
        });
        if (!item) continue;
        await tx.stockAdjustment.create({
          data: {
            item_id: pi.item_id,
            admin_id: production.admin_id,
            quantity: deductQty.negated().toNumber(),
            avg_price: Number(item.avg_price),
            reason: `Production Started - Batch #${batchNumber}`,
            production_id: id,
          },
        });
        const newQty = new Decimal(item.quantity.toString()).minus(deductQty);
        await tx.item.update({
          where: { id: pi.item_id },
          data: {
            quantity: newQty.toNumber(),
            avg_price: newQty.lessThanOrEqualTo(0) ? 0 : Number(item.avg_price),
          },
        });
      }
      await tx.production.update({
        where: { id },
        data: { status: ProductionStatus.IN_PROCESS, start_date: new Date() },
      });
    });

    this.logger.log(`Production ${production.batch_number} started (IN_PROCESS)`);
    return this.findOne(id);
  }

  /**
   * IN_PROCESS → DONE. Raw materials already deducted at start.
   * Use provided serial numbers (one per unit); create ProductionItems;
   * add final product StockAdjustment; update item; set DONE.
   */
  async complete(id: number, serialNumbers: string[]) {
    const production = await this.findOne(id);
    if (production.status !== ProductionStatus.IN_PROCESS) {
      throw new BadRequestException(
        `Production must be IN_PROCESS to complete. Current status: ${production.status}`,
      );
    }

    const finalProductId = production.recipe.final_product.id;
    const qty = production.quantity;
    const batchNumber = production.batch_number;

    const trimmed = serialNumbers.map((s) => s.trim());
    if (trimmed.length !== qty) {
      throw new BadRequestException(
        `Must provide exactly ${qty} serial number(s) for this production (got ${trimmed.length})`,
      );
    }
    const hasDuplicates = new Set(trimmed).size !== trimmed.length;
    if (hasDuplicates) {
      throw new BadRequestException('Duplicate serial numbers are not allowed');
    }

    const existing = await this.prisma.productionItem.findMany({
      where: { serial_number: { in: trimmed } },
      select: { serial_number: true },
    });
    if (existing.length > 0) {
      throw new BadRequestException(
        `Serial number(s) already in use: ${existing.map((e) => e.serial_number).join(', ')}`,
      );
    }

    const ingredients = await this.prisma.productionIngredient.findMany({
      where: { production_id: id },
      include: {
        item: { select: { id: true, name: true, avg_price: true } },
      },
    });
    if (ingredients.length === 0) {
      throw new BadRequestException('Production has no ingredients');
    }

    let costPerUnit = new Decimal(0);
    for (const pi of ingredients) {
      const q = new Decimal(pi.quantity.toString());
      const p = new Decimal(pi.item.avg_price.toString());
      costPerUnit = costPerUnit.add(q.mul(p));
    }
    const costPerUnitNum = costPerUnit.toNumber();
    const totalCostNum = costPerUnitNum * qty;

    await this.prisma.$transaction(async (tx) => {
      for (const serialNumber of trimmed) {
        await tx.productionItem.create({
          data: {
            production_id: id,
            item_id: finalProductId,
            serial_number: serialNumber,
            cost_price: costPerUnitNum,
            is_sold: false,
          },
        });
      }

      const finalItem = await tx.item.findUnique({
        where: { id: finalProductId },
        select: { quantity: true },
      });
      if (!finalItem) throw new BadRequestException('Final product item not found');
      const newFinalQty = new Decimal(finalItem.quantity.toString()).plus(qty);
      await tx.item.update({
        where: { id: finalProductId },
        data: {
          quantity: newFinalQty.toNumber(),
          avg_price: costPerUnitNum,
        },
      });

      await tx.stockAdjustment.create({
        data: {
          item_id: finalProductId,
          admin_id: production.admin_id,
          quantity: qty,
          avg_price: costPerUnitNum,
          reason: `Production Complete - Batch #${batchNumber}`,
          production_id: id,
        },
      });

      await tx.production.update({
        where: { id },
        data: {
          status: ProductionStatus.DONE,
          total_cost: totalCostNum,
          cost_per_unit: costPerUnitNum,
          completion_date: new Date(),
        },
      });
    });

    this.logger.log(
      `Production ${batchNumber} completed. cost_per_unit=${costPerUnitNum}, total_cost=${totalCostNum}, units=${qty}`,
    );
    return this.findOne(id);
  }

  async remove(id: number) {
    const production = await this.findOne(id);
    if (production.status !== ProductionStatus.DRAFT) {
      throw new BadRequestException(
        `Only DRAFT productions can be deleted. Current status: ${production.status}`,
      );
    }
    await this.prisma.production.delete({ where: { id } });
    this.logger.log(`Deleted production batch ${production.batch_number}`);
    return { message: 'Production deleted successfully' };
  }
}
