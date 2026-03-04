import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ItemType } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { PrismaService } from '../../common/database/prisma.service';
import { CreateSaleInvoiceDto } from '../dto/create-sale-invoice.dto';
import { ResolvedLineItem, SaleInvoiceTx } from './types';

@Injectable()
export class SaleInvoiceInventoryProvider {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Resolves line items: FINAL by serial (qty=1, price from ProductionItem), RAW by quantity (price from Item.avg_price).
   * Validates stock and item types. Throws on invalid serial, wrong type, or insufficient stock.
   */
  async resolveItems(
    items: CreateSaleInvoiceDto['items'],
    tx: SaleInvoiceTx,
  ): Promise<ResolvedLineItem[]> {
    const resolved: ResolvedLineItem[] = [];

    for (const row of items) {
      if (row.serial_number?.trim()) {
        resolved.push(await this.resolveFinalItem(row, tx));
      } else {
        resolved.push(await this.resolveRawItem(row, tx));
      }
    }

    return resolved;
  }

  private async resolveFinalItem(
    row: { item_id: number; serial_number?: string },
    tx: SaleInvoiceTx,
  ): Promise<ResolvedLineItem> {
    const serial = row.serial_number!.trim();
    const productionItem = await tx.productionItem.findUnique({
      where: { serial_number: serial },
      include: {
        item: { select: { id: true, name: true, item_type: true, quantity: true } },
      },
    });

    if (!productionItem) {
      throw new NotFoundException(`Production item with serial number "${serial}" not found`);
    }
    if (productionItem.item_id !== row.item_id) {
      throw new BadRequestException(
        `Serial "${serial}" belongs to item ID ${productionItem.item_id}, not ${row.item_id}`,
      );
    }
    if (productionItem.item.item_type !== ItemType.FINAL) {
      throw new BadRequestException(`Item ${row.item_id} is not a FINAL product`);
    }
    if (productionItem.is_sold) {
      throw new BadRequestException(`Serial "${serial}" is already sold`);
    }
    const qty = new Decimal(productionItem.item.quantity.toString());
    if (qty.lt(1)) {
      throw new BadRequestException(`Insufficient stock for item ${row.item_id} (serial ${serial})`);
    }

    const cost = new Decimal(productionItem.cost_price.toString());
    const unitPriceNum = cost.toNumber();
    return {
      item_id: row.item_id,
      item_name: productionItem.item.name,
      quantity: 1,
      unit_price: unitPriceNum,
      cost_price: unitPriceNum,
      total_price: unitPriceNum,
      profit: 0,
      production_item_id: productionItem.id,
      serial_number: productionItem.serial_number,
    };
  }

  private async resolveRawItem(
    row: { item_id: number; quantity?: number },
    tx: SaleInvoiceTx,
  ): Promise<ResolvedLineItem> {
    if (row.quantity == null || row.quantity <= 0) {
      throw new BadRequestException(`Quantity is required for RAW item (item_id: ${row.item_id})`);
    }

    const item = await tx.item.findUnique({
      where: { id: row.item_id },
    });
    if (!item) {
      throw new NotFoundException(`Item ${row.item_id} not found`);
    }
    if (item.item_type !== ItemType.RAW) {
      throw new BadRequestException(
        `Item ${row.item_id} is not RAW. For FINAL products use serial_number.`,
      );
    }
    const available = new Decimal(item.quantity.toString());
    const requested = new Decimal(row.quantity);
    if (available.lt(requested)) {
      throw new BadRequestException(
        `Insufficient stock for item ${row.item_id}: requested ${row.quantity}, available ${item.quantity}`,
      );
    }

    const unitPrice = new Decimal(item.avg_price.toString());
    const total = unitPrice.mul(requested);
    const costPriceNum = unitPrice.toNumber();
    const totalNum = total.toNumber();
    const qtyNum = requested.toNumber();
    return {
      item_id: row.item_id,
      item_name: item.name,
      quantity: qtyNum,
      unit_price: costPriceNum,
      cost_price: costPriceNum,
      total_price: totalNum,
      profit: totalNum - costPriceNum * qtyNum,
      production_item_id: null,
      serial_number: null,
    };
  }

  /**
   * Applies stock changes: mark ProductionItem is_sold and decrement Item.quantity for each resolved line.
   */
  async applyStockChanges(
    resolvedItems: ResolvedLineItem[],
    tx: SaleInvoiceTx,
  ): Promise<void> {
    for (const line of resolvedItems) {
      if (line.production_item_id) {
        await tx.productionItem.update({
          where: { id: line.production_item_id },
          data: { is_sold: true },
        });
        await tx.item.update({
          where: { id: line.item_id },
          data: { quantity: { decrement: 1 } },
        });
      } else {
        await tx.item.update({
          where: { id: line.item_id },
          data: { quantity: { decrement: line.quantity } },
        });
      }
    }
  }
}
