import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../common/database/prisma.service';
import { LoggerService } from '../common/logger/logger.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';
import { AccountFilterDto } from './dto/account-filter.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { PaginatedResponseDto } from '../common/dto/pagination-response.dto';
import { PaginationUtil } from '../common/utils/pagination.util';
import { AccountType, LedgerEntityType, TransactionType, Prisma } from '@prisma/client';
import { AccountResponseDto } from './dto/account-response.dto';
import { LedgerEntryResponseDto } from './dto/ledger-entry-response.dto';

@Injectable()
export class AccountService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: LoggerService,
  ) {
    this.logger.setContext('AccountService');
  }

  /**
   * Create a new account
   * Edge cases:
   * - Validates required fields based on account type
   * - Prevents duplicate account names
   * - Validates BANK type must have account_number and bank_name
   * - Sets current_balance equal to opening_balance initially
   */
  async create(createAccountDto: CreateAccountDto): Promise<AccountResponseDto> {
    this.logger.log(`Creating account: ${createAccountDto.name}`);

    // Edge case: Validate BANK type requirements
    if (createAccountDto.account_type === AccountType.BANK) {
      if (!createAccountDto.bank_name) {
        throw new BadRequestException('Bank name is required for BANK type accounts');
      }
    }

    // Edge case: Check for duplicate account name
    const existingAccount = await this.prisma.account.findFirst({
      where: {
        name: {
          equals: createAccountDto.name,
          mode: 'insensitive',
        },
      },
    });

    if (existingAccount) {
      throw new ConflictException(`Account with name "${createAccountDto.name}" already exists`);
    }

    // Edge case: Validate opening balance is non-negative
    const openingBalance = createAccountDto.opening_balance ?? 0;
    if (openingBalance < 0) {
      throw new BadRequestException('Opening balance cannot be negative');
    }

    try {
      // Use transaction to ensure account and ledger entry are created together
      const account = await this.prisma.$transaction(async (tx) => {
        // Create the account
        const newAccount = await tx.account.create({
          data: {
            name: createAccountDto.name.trim(),
            account_type: createAccountDto.account_type,
            account_number: createAccountDto.account_number?.trim() || null,
            bank_name: createAccountDto.bank_name?.trim() || null,
            opening_balance: openingBalance,
            current_balance: openingBalance, // Initially, current_balance = opening_balance
          },
        });

        // Create opening balance ledger entry if opening balance > 0
        if (openingBalance > 0) {
          await tx.ledgerEntry.create({
            data: {
              entity_type: LedgerEntityType.ACCOUNT,
              account_id: newAccount.id,
              transaction_type: TransactionType.CREDIT,
              amount: openingBalance,
              balance: openingBalance,
              description: 'Opening Balance',
              transaction_date: newAccount.created_at,
            },
          });
        }

        return newAccount;
      });

      this.logger.log(`Account created successfully with ID: ${account.id}`);
      return account;
    } catch (error) {
      this.logger.error(`Error creating account: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to create account');
    }
  }

  /**
   * Get paginated list of accounts with optional filters
   * Edge cases:
   * - Filters by account type if provided
   * - Handles pagination correctly
   * - Returns empty array if no accounts found
   * - Sorts by created_at descending
   */
  async findAll(filterDto: AccountFilterDto): Promise<PaginatedResponseDto<AccountResponseDto>> {
    this.logger.log('Fetching accounts list');

    const { page = 1, limit = 10, sortBy = 'created_at', sortOrder, account_type } = filterDto;
    const skip = PaginationUtil.getSkip(page, limit);
    const orderBy = PaginationUtil.buildOrderBy(sortBy, sortOrder);

    // Build where clause
    const where: Prisma.AccountWhereInput = {};

    // Edge case: Filter by account type if provided
    if (account_type) {
      where.account_type = account_type;
    }

    try {
      const [accounts, total] = await Promise.all([
        this.prisma.account.findMany({
          where,
          skip,
          take: limit,
          orderBy: orderBy || { created_at: 'desc' },
        }),
        this.prisma.account.count({ where }),
      ]);

      return PaginationUtil.createPaginatedResponse(accounts, total, filterDto);
    } catch (error) {
      this.logger.error(`Error fetching accounts: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to fetch accounts');
    }
  }

  /**
   * Get account details by ID with current balance
   * Edge cases:
   * - Throws NotFoundException if account doesn't exist
   * - Returns calculated current balance
   */
  async findOne(id: number): Promise<AccountResponseDto> {
    this.logger.log(`Fetching account with ID: ${id}`);

    // Edge case: Validate ID is positive
    if (id <= 0) {
      throw new BadRequestException('Invalid account ID');
    }

    const account = await this.prisma.account.findUnique({
      where: { id },
    });

    // Edge case: Account not found
    if (!account) {
      throw new NotFoundException(`Account with ID ${id} not found`);
    }

    return account;
  }

  /**
   * Update account details
   * Edge cases:
   * - Throws NotFoundException if account doesn't exist
   * - Prevents duplicate account names
   * - Cannot change account_type or opening_balance after creation
   * - Validates BANK type requirements if updating related fields
   * - Trims all string inputs
   */
  async update(id: number, updateAccountDto: UpdateAccountDto): Promise<AccountResponseDto> {
    this.logger.log(`Updating account with ID: ${id}`);

    // Edge case: Validate ID is positive
    if (id <= 0) {
      throw new BadRequestException('Invalid account ID');
    }

    // Edge case: Check if at least one field is provided
    if (Object.keys(updateAccountDto).length === 0) {
      throw new BadRequestException('At least one field must be provided for update');
    }

    // Edge case: Check if account exists
    const existingAccount = await this.prisma.account.findUnique({
      where: { id },
    });

    if (!existingAccount) {
      throw new NotFoundException(`Account with ID ${id} not found`);
    }

    // Edge case: Check for duplicate name if name is being updated
    if (updateAccountDto.name) {
      const duplicateName = await this.prisma.account.findFirst({
        where: {
          name: {
            equals: updateAccountDto.name.trim(),
            mode: 'insensitive',
          },
          id: { not: id },
        },
      });

      if (duplicateName) {
        throw new ConflictException(`Account with name "${updateAccountDto.name}" already exists`);
      }
    }

    // Edge case: If account is BANK type, validate required fields aren't being removed
    if (existingAccount.account_type === AccountType.BANK) {
      // Check if we're removing required fields
      if (updateAccountDto.account_number === '' || updateAccountDto.account_number === null) {
        throw new BadRequestException('Account number cannot be removed from BANK type accounts');
      }
      if (updateAccountDto.bank_name === '' || updateAccountDto.bank_name === null) {
        throw new BadRequestException('Bank name cannot be removed from BANK type accounts');
      }
    }

    // Prepare update data
    const updateData: Prisma.AccountUpdateInput = {};

    if (updateAccountDto.name) {
      updateData.name = updateAccountDto.name.trim();
    }
    if (updateAccountDto.account_number !== undefined) {
      updateData.account_number = updateAccountDto.account_number?.trim() || null;
    }
    if (updateAccountDto.bank_name !== undefined) {
      updateData.bank_name = updateAccountDto.bank_name?.trim() || null;
    }

    try {
      const updatedAccount = await this.prisma.account.update({
        where: { id },
        data: updateData,
      });

      this.logger.log(`Account updated successfully with ID: ${id}`);
      return updatedAccount;
    } catch (error) {
      this.logger.error(`Error updating account: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to update account');
    }
  }

  /**
   * Delete account
   * Edge cases:
   * - Throws NotFoundException if account doesn't exist
   * - Prevents deletion if account has transactions (ledger entries)
   * - Soft delete is not implemented - hard delete only if no transactions
   */
  async remove(id: number): Promise<{ message: string }> {
    this.logger.log(`Attempting to delete account with ID: ${id}`);

    // Edge case: Validate ID is positive
    if (id <= 0) {
      throw new BadRequestException('Invalid account ID');
    }

    // Edge case: Check if account exists
    const account = await this.prisma.account.findUnique({
      where: { id },
    });

    if (!account) {
      throw new NotFoundException(`Account with ID ${id} not found`);
    }

    // Edge case: Check if account has transactions (ledger entries)
    const ledgerEntryCount = await this.prisma.ledgerEntry.count({
      where: { account_id: id },
    });

    // Allow deletion only if:
    // 1. No ledger entries at all, OR
    // 2. Only one ledger entry (opening balance) and current balance equals opening balance
    if (ledgerEntryCount > 1) {
      throw new BadRequestException(
        'Cannot delete account with transaction history. Account has multiple ledger entries.',
      );
    }

    if (
      ledgerEntryCount === 1 &&
      account.current_balance.toString() !== account.opening_balance.toString()
    ) {
      throw new BadRequestException(
        'Cannot delete account with transaction history. Current balance differs from opening balance.',
      );
    }

    try {
      await this.prisma.account.delete({
        where: { id },
      });

      this.logger.log(`Account deleted successfully with ID: ${id}`);
      return { message: 'Account deleted successfully' };
    } catch (error) {
      this.logger.error(`Error deleting account: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to delete account');
    }
  }

  /**
   * Get account ledger/statement
   * Edge cases:
   * - Throws NotFoundException if account doesn't exist
   * - Returns opening balance entry as first entry
   * - Returns empty array if no transactions (only opening balance)
   * - Includes running balance for each entry
   * - Sorted by date ascending (oldest first)
   */
  async getAccountLedger(
    id: number,
    paginationDto: PaginationDto,
  ): Promise<PaginatedResponseDto<LedgerEntryResponseDto>> {
    this.logger.log(`Fetching ledger for account ID: ${id}`);

    // Edge case: Validate ID is positive
    if (id <= 0) {
      throw new BadRequestException('Invalid account ID');
    }

    // Edge case: Check if account exists
    const account = await this.prisma.account.findUnique({
      where: { id },
    });

    if (!account) {
      throw new NotFoundException(`Account with ID ${id} not found`);
    }

    const { page = 1, limit = 10 } = paginationDto;
    const skip = PaginationUtil.getSkip(page, limit);

    try {
      // Fetch ledger entries from database
      const [ledgerEntries, total] = await Promise.all([
        this.prisma.ledgerEntry.findMany({
          where: {
            account_id: id,
            entity_type: LedgerEntityType.ACCOUNT,
          },
          orderBy: { transaction_date: 'asc' },
          skip,
          take: limit,
          include: {
            payment: {
              select: {
                payment_number: true,
              },
            },
            purchase_invoice: {
              select: {
                invoice_number: true,
              },
            },
          },
        }),
        this.prisma.ledgerEntry.count({
          where: {
            account_id: id,
            entity_type: LedgerEntityType.ACCOUNT,
          },
        }),
      ]);

      // Transform to response DTO
      const ledgerResponseDto: LedgerEntryResponseDto[] = ledgerEntries.map((entry) => ({
        id: entry.id,
        date: entry.transaction_date,
        description: entry.description,
        type: entry.transaction_type,
        amount: parseFloat(entry.amount.toString()),
        balance: parseFloat(entry.balance.toString()),
        reference:
          entry.reference_number ||
          entry.payment?.payment_number ||
          entry.purchase_invoice?.invoice_number ||
          null,
      }));

      return PaginationUtil.createPaginatedResponse(ledgerResponseDto, total, paginationDto);
    } catch (error) {
      this.logger.error(`Error fetching account ledger: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to fetch account ledger');
    }
  }

  /**
   * Helper method to check if account exists
   * Used internally for validation
   */
  async accountExists(id: number): Promise<boolean> {
    const count = await this.prisma.account.count({
      where: { id },
    });
    return count > 0;
  }

  /**
   * Helper method to get account balance
   * Used for calculating balances after transactions
   */
  async getAccountBalance(id: number): Promise<number> {
    const account = await this.prisma.account.findUnique({
      where: { id },
      select: { current_balance: true },
    });

    if (!account) {
      throw new NotFoundException(`Account with ID ${id} not found`);
    }

    return parseFloat(account.current_balance.toString());
  }

  /**
   * Create a ledger entry for an account transaction.
   * Called when money moves in/out of an account (payments, purchase invoices, or expenses).
   * Expenses are separate from invoices: use expense_id only for expense flows; use
   * purchase_invoice_id only for purchase-invoice flows.
   *
   * @param accountId - The account ID
   * @param transactionType - CREDIT (money in) or DEBIT (money out)
   * @param amount - Transaction amount
   * @param description - Transaction description
   * @param referenceNumber - Optional reference (e.g. payment number)
   * @param relatedData - Link to source: payment_id, purchase_invoice_id, or expense_id (mutually exclusive by flow)
   */
  async createLedgerEntry(
    accountId: number,
    transactionType: TransactionType,
    amount: number,
    description: string,
    referenceNumber?: string,
    relatedData?: {
      payment_id?: number;
      purchase_invoice_id?: number;
      expense_id?: number;
    },
  ): Promise<void> {
    this.logger.log(`Creating ledger entry for account ${accountId}: ${transactionType} ${amount}`);

    // Get current balance
    const currentBalance = await this.getAccountBalance(accountId);

    // For DEBIT (money out): ensure account has sufficient balance
    if (transactionType === TransactionType.DEBIT) {
      if (amount > currentBalance) {
        throw new BadRequestException(
          `Payment amount (${amount}) exceeds account available balance (${currentBalance})`,
        );
      }
    }

    // Calculate new balance
    const newBalance =
      transactionType === TransactionType.CREDIT
        ? currentBalance + amount
        : currentBalance - amount;

    // Prevent negative balance (safety net)
    if (newBalance < 0) {
      throw new BadRequestException(
        'Insufficient funds. Transaction would result in negative account balance.',
      );
    }

    await this.prisma.$transaction(async (tx) => {
      // Create ledger entry
      await tx.ledgerEntry.create({
        data: {
          entity_type: LedgerEntityType.ACCOUNT,
          account_id: accountId,
          transaction_type: transactionType,
          amount,
          balance: newBalance,
          description,
          reference_number: referenceNumber,
          payment_id: relatedData?.payment_id,
          purchase_invoice_id: relatedData?.purchase_invoice_id,
          expense_id: relatedData?.expense_id,
        },
      });

      // Update account current balance
      await tx.account.update({
        where: { id: accountId },
        data: { current_balance: newBalance },
      });
    });

    this.logger.log(`Ledger entry created. New balance: ${newBalance}`);
  }

  /**
   * Update account balance (recalculate from all ledger entries)
   * Useful for reconciliation or fixing balance discrepancies
   */
  async recalculateBalance(accountId: number): Promise<void> {
    this.logger.log(`Recalculating balance for account ${accountId}`);

    const account = await this.prisma.account.findUnique({
      where: { id: accountId },
      select: { opening_balance: true },
    });

    if (!account) {
      throw new NotFoundException(`Account with ID ${accountId} not found`);
    }

    // Get all ledger entries for this account
    const ledgerEntries = await this.prisma.ledgerEntry.findMany({
      where: {
        account_id: accountId,
        entity_type: LedgerEntityType.ACCOUNT,
      },
      orderBy: { transaction_date: 'asc' },
      select: {
        transaction_type: true,
        amount: true,
      },
    });

    // Calculate balance from opening balance and all transactions
    let calculatedBalance = parseFloat(account.opening_balance.toString());

    for (const entry of ledgerEntries) {
      if (entry.transaction_type === TransactionType.CREDIT) {
        calculatedBalance += parseFloat(entry.amount.toString());
      } else {
        calculatedBalance -= parseFloat(entry.amount.toString());
      }
    }

    // Update account balance
    await this.prisma.account.update({
      where: { id: accountId },
      data: { current_balance: calculatedBalance },
    });

    this.logger.log(`Balance recalculated for account ${accountId}: ${calculatedBalance}`);
  }
}
