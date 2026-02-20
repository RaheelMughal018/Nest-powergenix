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
import { RecipeIngredientDto } from './dto/recipe-ingredient.dto';

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

  // FIX 3: Removed incorrect "Only allowed if no DONE production exists" from description
  @Patch(':id')
  @ApiOperation({ summary: 'Update recipe name, description or ingredients' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Recipe updated' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Recipe not found' })
  update(@Param('id', ParseIntPipe) id: number, @Body() updateRecipeDto: UpdateRecipeDto) {
    return this.recipeService.update(id, updateRecipeDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete recipe (blocked if any IN_PROCESS or DONE productions exist)' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Recipe deleted' })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: 'Recipe has IN_PROCESS or DONE productions' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.recipeService.remove(id);
  }

  // FIX 4: Use RecipeIngredientDto instead of raw object — proper validation
  @Post(':id/ingredients')
  @ApiOperation({ summary: 'Add a single ingredient to recipe' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Ingredient added' })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: 'Item already in recipe' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Item is not RAW or is the final product itself' })
  addIngredient(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: RecipeIngredientDto,
  ) {
    return this.recipeService.addIngredient(id, body.item_id, body.quantity);
  }

  @Patch(':id/ingredients/:itemId')
  @ApiOperation({ summary: 'Update quantity of an existing ingredient' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Ingredient updated' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Ingredient not found in recipe' })
  updateIngredient(
    @Param('id', ParseIntPipe) id: number,
    @Param('itemId', ParseIntPipe) itemId: number,
    @Body() body: { quantity: number },
  ) {
    return this.recipeService.updateIngredient(id, itemId, body.quantity);
  }

  @Delete(':id/ingredients/:itemId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove an ingredient from recipe' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Ingredient removed' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Ingredient not found in recipe' })
  removeIngredient(
    @Param('id', ParseIntPipe) id: number,
    @Param('itemId', ParseIntPipe) itemId: number,
  ) {
    return this.recipeService.removeIngredient(id, itemId);
  }
}