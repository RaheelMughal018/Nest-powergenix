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
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiParam } from '@nestjs/swagger';
import { AccountService } from './account.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';
import { AccountFilterDto } from './dto/account-filter.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { ApiPaginatedResponse } from '../common/decorators/api-paginated-response.decorator';
import { AccountResponseDto } from './dto/account-response.dto';
import { LedgerEntryResponseDto } from './dto/ledger-entry-response.dto';

@ApiTags('Accounts')
@ApiBearerAuth('JWT-auth')
@Controller('accounts')
export class AccountController {
  constructor(private readonly accountService: AccountService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a new account',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Account created successfully',
    type: AccountResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data or validation failed',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Account with this name already exists',
  })
  create(@Body() createAccountDto: CreateAccountDto): Promise<AccountResponseDto> {
    return this.accountService.create(createAccountDto);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get paginated list of accounts',
  })
  @ApiPaginatedResponse(AccountResponseDto)
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid query parameters',
  })
  findAll(@Query() filterDto: AccountFilterDto) {
    return this.accountService.findAll(filterDto);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get account details by ID',
  })
  @ApiParam({
    name: 'id',
    description: 'Account ID',
    type: Number,
    example: 1,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Account details retrieved successfully',
    type: AccountResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid account ID',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Account not found',
  })
  findOne(@Param('id', ParseIntPipe) id: number): Promise<AccountResponseDto> {
    return this.accountService.findOne(id);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update account details',
  })
  @ApiParam({
    name: 'id',
    description: 'Account ID',
    type: Number,
    example: 1,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Account updated successfully',
    type: AccountResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data or validation failed',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Account not found',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Account with this name already exists',
  })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateAccountDto: UpdateAccountDto,
  ): Promise<AccountResponseDto> {
    return this.accountService.update(id, updateAccountDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete account',
  })
  @ApiParam({
    name: 'id',
    description: 'Account ID',
    type: Number,
    example: 1,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Account deleted successfully',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Account deleted successfully',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Cannot delete account with transaction history',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Account not found',
  })
  remove(@Param('id', ParseIntPipe) id: number): Promise<{ message: string }> {
    return this.accountService.remove(id);
  }

  @Get(':id/ledger')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get account ledger/statement',
  })
  @ApiParam({
    name: 'id',
    description: 'Account ID',
    type: Number,
    example: 1,
  })
  @ApiPaginatedResponse(LedgerEntryResponseDto)
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid account ID or pagination parameters',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Account not found',
  })
  getAccountLedger(@Param('id', ParseIntPipe) id: number, @Query() paginationDto: PaginationDto) {
    return this.accountService.getAccountLedger(id, paginationDto);
  }
}
