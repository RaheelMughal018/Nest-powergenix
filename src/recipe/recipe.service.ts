import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../common/database/prisma.service';
import { LoggerService } from '../common/logger/logger.service';
import { CreateRecipeDto } from './dto/create-recipe.dto';
import { UpdateRecipeDto } from './dto/update-recipe.dto';
import { ItemType } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class RecipeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: LoggerService,
  ) {
    this.logger.setContext('RecipeService');
  }

  /**
   * Create a recipe for a FINAL product (blueprint).
   * All ingredients must be RAW items. Cost is calculated dynamically at read/completion time.
   */
  async create(dto: CreateRecipeDto) {
    const item = await this.prisma.item.findUnique({
      where: { id: dto.final_product_id },
      select: { id: true, name: true, item_type: true },
    });
    if (!item) {
      throw new NotFoundException(`Item with ID ${dto.final_product_id} not found`);
    }
    if (item.item_type !== ItemType.FINAL) {
      throw new BadRequestException(
        `Recipe final product must be a FINAL item. Item "${item.name}" is ${item.item_type}.`,
      );
    }

    const existingRecipe = await this.prisma.recipe.findUnique({
      where: { final_product_id: dto.final_product_id },
    });
    if (existingRecipe) {
      throw new ConflictException(
        `Item "${item.name}" already has a recipe. One final product can have only one recipe.`,
      );
    }

    const itemIds = dto.ingredients.map((i) => i.item_id);
    const uniqueIds = [...new Set(itemIds)];
    if (uniqueIds.length !== itemIds.length) {
      throw new BadRequestException('Duplicate item_id in ingredients');
    }

    const ingredientsExist = await this.prisma.item.findMany({
      where: { id: { in: uniqueIds } },
      select: { id: true, name: true, item_type: true },
    });
    if (ingredientsExist.length !== uniqueIds.length) {
      throw new BadRequestException('One or more ingredient item IDs do not exist');
    }
    const nonRaw = ingredientsExist.filter((i) => i.item_type !== ItemType.RAW);
    if (nonRaw.length > 0) {
      throw new BadRequestException(
        `All recipe ingredients must be RAW items. Non-RAW: ${nonRaw.map((i) => `${i.name} (${i.item_type})`).join(', ')}`,
      );
    }

    if (uniqueIds.includes(dto.final_product_id)) {
      throw new BadRequestException('Final product cannot be an ingredient of itself');
    }

    const recipe = await this.prisma.recipe.create({
      data: {
        name: dto.name.trim(),
        description: dto.description?.trim() ?? null,
        final_product_id: dto.final_product_id,
        ingredients: {
          create: dto.ingredients.map((ing) => ({
            item_id: ing.item_id,
            quantity: ing.quantity,
          })),
        },
      },
      include: {
        final_product: {
          select: { id: true, name: true, item_type: true, quantity: true, avg_price: true },
        },
        ingredients: {
          include: {
            item: {
              select: { id: true, name: true, avg_price: true, quantity: true },
            },
          },
        },
      },
    });

    this.logger.log(`Created recipe "${recipe.name}" for final product ${item.name}`);
    return recipe;
  }

  async findAll() {
    return this.prisma.recipe.findMany({
      include: {
        final_product: {
          select: { id: true, name: true, item_type: true, quantity: true, avg_price: true },
        },
        ingredients: {
          include: {
            item: {
              select: { id: true, name: true, avg_price: true, quantity: true },
            },
          },
        },
      },
      orderBy: { id: 'desc' },
    });
  }

  async findOne(id: number) {
    const recipe = await this.prisma.recipe.findUnique({
      where: { id },
      include: {
        final_product: {
          select: { id: true, name: true, item_type: true, quantity: true, avg_price: true },
        },
        ingredients: {
          include: {
            item: {
              select: { id: true, name: true, avg_price: true, quantity: true },
            },
          },
        },
      },
    });
    if (!recipe) {
      throw new NotFoundException(`Recipe with ID ${id} not found`);
    }
    return recipe;
  }

  /**
   * Dynamic cost per unit = sum(ingredient.quantity × current item.avg_price).
   */
  async getCostPerUnit(id: number): Promise<{
    cost_per_unit: number;
    breakdown: Array<{
      item_id: number;
      item_name: string;
      quantity: number;
      avg_price: number;
      line_cost: number;
    }>;
  }> {
    const recipe = await this.findOne(id);
    let cost = new Decimal(0);
    const breakdown: Array<{
      item_id: number;
      item_name: string;
      quantity: number;
      avg_price: number;
      line_cost: number;
    }> = [];

    for (const ing of recipe.ingredients) {
      const qty = new Decimal(ing.quantity.toString());
      const avgPrice = new Decimal(ing.item.avg_price.toString());
      const lineCost = qty.mul(avgPrice);
      cost = cost.add(lineCost);
      breakdown.push({
        item_id: ing.item.id,
        item_name: ing.item.name,
        quantity: Number(ing.quantity),
        avg_price: Number(ing.item.avg_price),
        line_cost: lineCost.toNumber(),
      });
    }

    return {
      cost_per_unit: cost.toNumber(),
      breakdown,
    };
  }

  /** Recipe can only be edited if no production is DONE yet (blueprint rule). */
  private async ensureRecipeEditable(recipeId: number, recipeName: string) {
    const doneCount = await this.prisma.production.count({
      where: { recipe_id: recipeId, status: 'DONE' },
    });
    if (doneCount > 0) {
      throw new ConflictException(
        `Cannot edit recipe "${recipeName}" because ${doneCount} production batch(es) are already DONE. Recipe is a permanent blueprint once production completes.`,
      );
    }
  }

  async update(id: number, dto: UpdateRecipeDto) {
    const recipe = await this.findOne(id);
    await this.ensureRecipeEditable(id, recipe.name);

    if (dto.ingredients !== undefined) {
      const itemIds = dto.ingredients.map((i) => i.item_id);
      const uniqueIds = [...new Set(itemIds)];
      if (uniqueIds.length !== itemIds.length) {
        throw new BadRequestException('Duplicate item_id in ingredients');
      }
      const ingredientsExist = await this.prisma.item.findMany({
        where: { id: { in: uniqueIds } },
        select: { id: true, item_type: true, name: true },
      });
      if (ingredientsExist.length !== uniqueIds.length) {
        throw new BadRequestException('One or more ingredient item IDs do not exist');
      }
      const nonRaw = ingredientsExist.filter((i) => i.item_type !== ItemType.RAW);
      if (nonRaw.length > 0) {
        throw new BadRequestException(
          `All recipe ingredients must be RAW items. Non-RAW: ${nonRaw.map((i) => i.name).join(', ')}`,
        );
      }
      if (uniqueIds.includes(recipe.final_product_id)) {
        throw new BadRequestException('Final product cannot be an ingredient of itself');
      }
    }

    await this.prisma.$transaction(async (tx) => {
      if (dto.ingredients !== undefined) {
        await tx.recipeIngredient.deleteMany({ where: { recipe_id: id } });
      }
      await tx.recipe.update({
        where: { id },
        data: {
          ...(dto.name !== undefined && { name: dto.name.trim() }),
          ...(dto.description !== undefined && { description: dto.description?.trim() ?? null }),
          ...(dto.ingredients !== undefined &&
            dto.ingredients.length > 0 && {
              ingredients: {
                create: dto.ingredients.map((ing) => ({
                  item_id: ing.item_id,
                  quantity: ing.quantity,
                })),
              },
            }),
        },
      });
    });

    this.logger.log(`Updated recipe ID ${id}`);
    return this.findOne(id);
  }

  async remove(id: number) {
    const recipe = await this.findOne(id);
    const productionCount = await this.prisma.production.count({
      where: { recipe_id: id },
    });
    if (productionCount > 0) {
      throw new ConflictException(
        `Cannot delete recipe "${recipe.name}" because ${productionCount} production batch(es) use it.`,
      );
    }

    await this.prisma.recipe.delete({ where: { id } });
    this.logger.log(`Deleted recipe "${recipe.name}"`);
    return { message: 'Recipe deleted successfully' };
  }

  async addIngredient(recipeId: number, itemId: number, quantity: number) {
    const recipe = await this.findOne(recipeId);
    await this.ensureRecipeEditable(recipeId, recipe.name);
    if (recipe.final_product_id === itemId) {
      throw new BadRequestException('Final product cannot be an ingredient of itself');
    }
    const item = await this.prisma.item.findUnique({
      where: { id: itemId },
      select: { id: true, name: true, item_type: true },
    });
    if (!item) throw new NotFoundException(`Item with ID ${itemId} not found`);
    if (item.item_type !== ItemType.RAW) {
      throw new BadRequestException(
        `Ingredient must be a RAW item. "${item.name}" is ${item.item_type}.`,
      );
    }
    const existing = await this.prisma.recipeIngredient.findUnique({
      where: { recipe_id_item_id: { recipe_id: recipeId, item_id: itemId } },
    });
    if (existing) {
      throw new ConflictException(`Item "${item.name}" is already in this recipe`);
    }
    await this.prisma.recipeIngredient.create({
      data: { recipe_id: recipeId, item_id: itemId, quantity },
    });
    this.logger.log(`Added ingredient ${item.name} to recipe ${recipe.name}`);
    return this.findOne(recipeId);
  }

  async updateIngredient(recipeId: number, itemId: number, quantity: number) {
    const recipe = await this.findOne(recipeId);
    await this.ensureRecipeEditable(recipeId, recipe.name);
    const existing = await this.prisma.recipeIngredient.findUnique({
      where: { recipe_id_item_id: { recipe_id: recipeId, item_id: itemId } },
      include: { item: { select: { name: true } } },
    });
    if (!existing) {
      throw new NotFoundException(`Ingredient item ID ${itemId} not found in this recipe`);
    }
    await this.prisma.recipeIngredient.update({
      where: { recipe_id_item_id: { recipe_id: recipeId, item_id: itemId } },
      data: { quantity },
    });
    this.logger.log(`Updated ingredient ${existing.item.name} quantity in recipe ${recipe.name}`);
    return this.findOne(recipeId);
  }

  async removeIngredient(recipeId: number, itemId: number) {
    const recipe = await this.findOne(recipeId);
    await this.ensureRecipeEditable(recipeId, recipe.name);
    const existing = await this.prisma.recipeIngredient.findUnique({
      where: { recipe_id_item_id: { recipe_id: recipeId, item_id: itemId } },
      include: { item: { select: { name: true } } },
    });
    if (!existing) {
      throw new NotFoundException(`Ingredient item ID ${itemId} not found in this recipe`);
    }
    await this.prisma.recipeIngredient.delete({
      where: { recipe_id_item_id: { recipe_id: recipeId, item_id: itemId } },
    });
    this.logger.log(`Removed ingredient ${existing.item.name} from recipe ${recipe.name}`);
    return this.findOne(recipeId);
  }
}
