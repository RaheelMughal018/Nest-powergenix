import { PaginationDto } from '../dto/pagination.dto';
import { PaginatedResponseDto } from '../dto/pagination-response.dto';

export class PaginationUtil {
  /**
   * Calculate skip value for database queries
   */
  static getSkip(page: number, limit: number): number {
    return (page - 1) * limit;
  }

  /**
   * Create paginated response
   */
  static createPaginatedResponse<T>(
    items: T[],
    totalItems: number,
    paginationDto: PaginationDto,
  ): PaginatedResponseDto<T> {
    const { page = 1, limit = 10 } = paginationDto;
    return new PaginatedResponseDto(items, totalItems, page, limit);
  }

  /**
   * Build Prisma orderBy object
   */
  static buildOrderBy(sortBy?: string, sortOrder?: string): Record<string, string> | undefined {
    if (!sortBy) return undefined;
    return { [sortBy]: sortOrder || 'desc' };
  }

  /**
   * Build search where clause for Prisma
   */
  static buildSearchWhere<T extends Record<string, any>>(
    search: string | undefined,
    searchFields: string[],
    additionalWhere?: T,
  ): T {
    const baseWhere = additionalWhere || ({} as T);

    if (!search || searchFields.length === 0) {
      return baseWhere;
    }

    const searchConditions = searchFields.map((field) => ({
      [field]: {
        contains: search,
        mode: 'insensitive' as const,
      },
    }));

    return {
      ...baseWhere,
      OR: searchConditions,
    } as T;
  }
}
