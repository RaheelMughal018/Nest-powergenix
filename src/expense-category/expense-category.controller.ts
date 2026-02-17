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
import { ExpenseCategoryService } from './expense-category.service';
import { CreateExpenseCategoryDto } from './dto/create-expense-category.dto';
import { UpdateExpenseCategoryDto } from './dto/update-expense-category.dto';

@ApiTags('Expense Categories')
@ApiBearerAuth('JWT-auth')
@Controller('expense-categories')
export class ExpenseCategoryController {
  constructor(private readonly expenseCategoryService: ExpenseCategoryService) {}

  @Post()
  @ApiOperation({ summary: 'Create expense category' })
  @ApiResponse({ status: HttpStatus.CREATED })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: 'Name already exists' })
  create(@Body() dto: CreateExpenseCategoryDto) {
    return this.expenseCategoryService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all expense categories' })
  findAll() {
    return this.expenseCategoryService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get expense category by ID' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.expenseCategoryService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update expense category' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: 'Name already exists' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateExpenseCategoryDto) {
    return this.expenseCategoryService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete expense category (only if no expenses)' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: 'Category has expenses' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.expenseCategoryService.remove(id);
  }
}
