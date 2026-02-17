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
import { ProductionService } from './production.service';
import { CreateProductionDto } from './dto/create-production.dto';
import { UpdateProductionDto } from './dto/update-production.dto';
import { UpdateProductionIngredientsDto } from './dto/update-production-ingredients.dto';
import { CompleteProductionDto } from './dto/complete-production.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ProductionStatus } from '@prisma/client';

@ApiTags('Productions')
@ApiBearerAuth('JWT-auth')
@Controller('productions')
export class ProductionController {
  constructor(private readonly productionService: ProductionService) {}

  @Post()
  @ApiOperation({
    summary: 'Create production (DRAFT)',
    description:
      'Copies recipe ingredients to production_ingredients. Batch can modify ingredients without affecting base recipe (Rule 4).',
  })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Production created' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid input' })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: 'Batch number already exists' })
  create(@Body() dto: CreateProductionDto, @CurrentUser('id') userId: number) {
    return this.productionService.create(dto, userId);
  }

  @Get()
  @ApiOperation({ summary: 'List productions' })
  @ApiQuery({ name: 'status', enum: ProductionStatus, required: false })
  findAll(@Query('status') status?: ProductionStatus) {
    return this.productionService.findAll(status);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get production by ID' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Production not found' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.productionService.findOne(id);
  }

  @Get(':id/feasibility')
  @ApiOperation({
    summary: 'Check stock feasibility',
    description:
      'Uses ProductionIngredient (not Recipe). Shows required vs available per ingredient and estimated cost.',
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Production not found' })
  getFeasibility(@Param('id', ParseIntPipe) id: number) {
    return this.productionService.getFeasibility(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update production (notes only, DRAFT only)' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateProductionDto) {
    return this.productionService.update(id, dto);
  }

  @Patch(':id/ingredients')
  @ApiOperation({
    summary: 'Update production ingredients (Rule 4)',
    description:
      'Modify ingredients for this batch only. Allowed in DRAFT or IN_PROCESS. Does not affect base recipe.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input or production already DONE',
  })
  updateIngredients(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateProductionIngredientsDto,
  ) {
    return this.productionService.updateIngredients(id, body.ingredients);
  }

  @Post(':id/start')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Start production (DRAFT → IN_PROCESS)' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Not DRAFT or no ingredients' })
  start(@Param('id', ParseIntPipe) id: number) {
    return this.productionService.start(id);
  }

  @Post(':id/complete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Complete production (IN_PROCESS → DONE)',
    description:
      'Provide one serial number per unit (e.g. 2 products → ["LEH-001", "LEH-007"]). Raw materials already deducted at start. Sets cost_per_unit and creates ProductionItems.',
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Not IN_PROCESS, wrong count, duplicates, or serial already in use' })
  complete(@Param('id', ParseIntPipe) id: number, @Body() body: CompleteProductionDto) {
    return this.productionService.complete(id, body.serialNumbers);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete production (DRAFT only)' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Only DRAFT can be deleted' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.productionService.remove(id);
  }
}
