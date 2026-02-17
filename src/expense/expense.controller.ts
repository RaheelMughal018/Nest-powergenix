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
import { ExpenseService } from './expense.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { BulkExpensesByDayDto } from './dto/bulk-expenses-by-day.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Expenses')
@ApiBearerAuth('JWT-auth')
@Controller('expenses')
export class ExpenseController {
  constructor(private readonly expenseService: ExpenseService) {}

  @Post()
  @ApiOperation({ summary: 'Create a single expense' })
  @ApiResponse({ status: HttpStatus.CREATED })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Category or account not found' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Insufficient funds (ledger)' })
  create(@Body() dto: CreateExpenseDto, @CurrentUser('id') userId: number) {
    return this.expenseService.create(dto, userId);
  }

  @Post('bulk-by-day')
  @ApiOperation({
    summary: 'Create multiple expenses for a single day',
    description:
      'Pass a date (YYYY-MM-DD) and an array of expenses. All expenses use that date. Each creates a DEBIT on the given account.',
  })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Returns array of created expenses' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Category or account not found' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid date or insufficient funds' })
  createBulkByDay(@Body() dto: BulkExpensesByDayDto, @CurrentUser('id') userId: number) {
    return this.expenseService.createBulkByDay(dto, userId);
  }

  @Get()
  @ApiOperation({
    summary: 'List expenses',
    description:
      'Optional filters: date range (from/to), search across description, notes, category name, account name, admin name, or exact amount.',
  })
  @ApiQuery({ name: 'from', required: false, description: 'From date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'to', required: false, description: 'To date (YYYY-MM-DD)' })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Search in description, notes, category name, account name, admin name; or exact amount if numeric',
  })
  findAll(
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('search') search?: string,
  ) {
    return this.expenseService.findAll(
      from || to || search ? { from, to, search } : undefined,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get expense by ID' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.expenseService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update expense' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateExpenseDto) {
    return this.expenseService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete expense (creates ledger reversal)' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.expenseService.remove(id);
  }
}
