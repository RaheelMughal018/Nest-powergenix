import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/database/prisma.service';
import { LoggerService } from '../common/logger/logger.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { PaginatedResponseDto } from '../common/dto/pagination-response.dto';
import { PaginationUtil } from '../common/utils/pagination.util';

@Injectable()
export class CustomerService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: LoggerService,
  ) {
    this.logger.setContext('CustomerService');
  }

  async create(createCustomerDto: CreateCustomerDto) {
    const customer = await this.prisma.customer.create({
      data: {
        name: createCustomerDto.name,
        company_name: createCustomerDto.company_name,
        phone: createCustomerDto.phone,
        address: createCustomerDto.address,
        opening_balance: createCustomerDto.opening_balance || 0,
        current_balance: createCustomerDto.opening_balance || 0,
      },
    });

    this.logger.log(`Created customer: ${customer.name}`);
    return customer;
  }

  async findAll(paginationDto: PaginationDto): Promise<PaginatedResponseDto<any>> {
    const { page = 1, limit = 10, search, sortBy = 'created_at', sortOrder } = paginationDto;

    const skip = PaginationUtil.getSkip(page, limit);
    const orderBy = PaginationUtil.buildOrderBy(sortBy, sortOrder);

    // Build search conditions
    const where = PaginationUtil.buildSearchWhere(search, ['name', 'company_name', 'phone']);

    const [customers, total] = await Promise.all([
      this.prisma.customer.findMany({
        where,
        skip,
        take: limit,
        orderBy,
      }),
      this.prisma.customer.count({ where }),
    ]);

    return PaginationUtil.createPaginatedResponse(customers, total, paginationDto);
  }

  async findOne(id: number) {
    const customer = await this.prisma.customer.findUnique({
      where: { id },
    });

    if (!customer) {
      throw new NotFoundException(`Customer with ID ${id} not found`);
    }

    return customer;
  }

  async update(id: number, updateCustomerDto: UpdateCustomerDto) {
    await this.findOne(id); // Check if exists

    const customer = await this.prisma.customer.update({
      where: { id },
      data: {
        name: updateCustomerDto.name,
        company_name: updateCustomerDto.company_name,
        phone: updateCustomerDto.phone,
        address: updateCustomerDto.address,
        opening_balance: updateCustomerDto.opening_balance,
      },
    });

    this.logger.log(`Updated customer: ${customer.name}`);
    return customer;
  }

  async remove(id: number) {
    await this.findOne(id); // Check if exists

    await this.prisma.customer.delete({
      where: { id },
    });

    this.logger.log(`Deleted customer with ID: ${id}`);
    return { message: 'Customer deleted successfully' };
  }
}
