import { PartialType, PickType } from '@nestjs/swagger';
import { CreateItemDto } from './create-item.dto';

// Only allow updating name and category_id (NOT item_type, quantity, or avg_price)
export class UpdateItemDto extends PartialType(PickType(CreateItemDto, ['name', 'category_id'] as const)) {}
