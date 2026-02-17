import { Module } from '@nestjs/common';
import { ExpenseCategoryService } from './expense-category.service';
import { ExpenseCategoryController } from './expense-category.controller';
import { DatabaseModule } from '../common/database/database.module';
import { LoggerModule } from '../common/logger/logger.module';

@Module({
  imports: [DatabaseModule, LoggerModule],
  controllers: [ExpenseCategoryController],
  providers: [ExpenseCategoryService],
  exports: [ExpenseCategoryService],
})
export class ExpenseCategoryModule {}
