import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { RecipeService } from './recipe.service';
import { CreateRecipeDto } from './dto/create-recipe.dto';
import { UpdateRecipeDto } from './dto/update-recipe.dto';

@ApiTags('Recipes')
@ApiBearerAuth('JWT-auth')
@Controller('recipes')
export class RecipeController {
  constructor(private readonly recipeService: RecipeService) {}

  @Post()
  @ApiOperation({ summary: 'Create a recipe for a FINAL product (blueprint)' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Recipe created' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid input or final product not FINAL / ingredients not RAW' })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: 'Final product already has a recipe' })
  create(@Body() createRecipeDto: CreateRecipeDto) {
    return this.recipeService.create(createRecipeDto);
  }

  @Get()
  @ApiOperation({ summary: 'List all recipes' })
  findAll() {
    return this.recipeService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get recipe by ID with ingredients' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Recipe not found' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.recipeService.findOne(id);
  }

  @Get(':id/cost')
  @ApiOperation({
    summary: 'Get computed cost per unit',
    description: 'cost_per_unit = sum(ingredient.quantity × current item.avg_price). Uses current prices.',
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Recipe not found' })
  getCostPerUnit(@Param('id', ParseIntPipe) id: number) {
    return this.recipeService.getCostPerUnit(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update recipe (name/description/ingredients). Only allowed if no DONE production exists.',
  })
  @ApiResponse({ status: HttpStatus.OK, description: 'Recipe updated' })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: 'Recipe has DONE productions' })
  update(@Param('id', ParseIntPipe) id: number, @Body() updateRecipeDto: UpdateRecipeDto) {
    return this.recipeService.update(id, updateRecipeDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete recipe (only if no productions use it)' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Recipe deleted' })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: 'Recipe has productions' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.recipeService.remove(id);
  }

  @Post(':id/ingredients')
  @ApiOperation({ summary: 'Add ingredient to recipe (only if no DONE production)' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Ingredient added' })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: 'Recipe has DONE productions or item already in recipe' })
  addIngredient(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { item_id: number; quantity: number },
  ) {
    return this.recipeService.addIngredient(id, body.item_id, body.quantity);
  }

  @Patch(':id/ingredients/:itemId')
  @ApiOperation({ summary: 'Update ingredient quantity (only if no DONE production)' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Ingredient updated' })
  updateIngredient(
    @Param('id', ParseIntPipe) id: number,
    @Param('itemId', ParseIntPipe) itemId: number,
    @Body() body: { quantity: number },
  ) {
    return this.recipeService.updateIngredient(id, itemId, body.quantity);
  }

  @Delete(':id/ingredients/:itemId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove ingredient from recipe (only if no DONE production)' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Ingredient removed' })
  removeIngredient(
    @Param('id', ParseIntPipe) id: number,
    @Param('itemId', ParseIntPipe) itemId: number,
  ) {
    return this.recipeService.removeIngredient(id, itemId);
  }
}
