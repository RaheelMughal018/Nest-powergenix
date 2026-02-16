# Weighted Average Price Calculation Guide

Understanding how average price is calculated during stock adjustments.

---

## 📐 The Formula

### When Adding Stock (quantity > 0)

```
new_avg_price = (old_quantity × old_avg_price + new_quantity × unit_price) / (old_quantity + new_quantity)
```

### When Removing Stock (quantity < 0)

```
avg_price = UNCHANGED (remains the same)
```

### When Stock Reaches Zero

```
avg_price = RESET to 0
```

---

## 📊 Visual Examples

### Example 1: First Stock Addition

**Initial State:**
```
┌─────────────────────────┐
│ Item: Steel Wheel       │
│ Quantity: 0 units       │
│ Avg Price: Rs 0/unit    │
│ Total Value: Rs 0       │
└─────────────────────────┘
```

**Action:** Add 10 units @ Rs 5/unit
```
POST /items/1/adjust-stock
{
  "quantity": 10,
  "unit_price": 5,
  "reason": "Opening Stock"
}
```

**Calculation:**
```
new_avg_price = (0 × 0 + 10 × 5) / (0 + 10)
              = (0 + 50) / 10
              = 50 / 10
              = Rs 5/unit
```

**Final State:**
```
┌─────────────────────────┐
│ Item: Steel Wheel       │
│ Quantity: 10 units      │
│ Avg Price: Rs 5/unit    │
│ Total Value: Rs 50      │
└─────────────────────────┘
```

---

### Example 2: Weighted Average Calculation

**Initial State:**
```
┌─────────────────────────┐
│ Item: Steel Wheel       │
│ Quantity: 10 units      │
│ Avg Price: Rs 5/unit    │
│ Total Value: Rs 50      │
└─────────────────────────┘
```

**Action:** Add 20 units @ Rs 4/unit
```
POST /items/1/adjust-stock
{
  "quantity": 20,
  "unit_price": 4,
  "reason": "Purchase from Supplier A"
}
```

**Calculation:**
```
Old Stock Value:
  10 units × Rs 5/unit = Rs 50

New Stock Cost:
  20 units × Rs 4/unit = Rs 80

Total Value:
  Rs 50 + Rs 80 = Rs 130

Total Quantity:
  10 + 20 = 30 units

New Average Price:
  Rs 130 / 30 units = Rs 4.333.../unit ≈ Rs 4.33/unit
```

**Formula Applied:**
```
new_avg_price = (10 × 5 + 20 × 4) / (10 + 20)
              = (50 + 80) / 30
              = 130 / 30
              = Rs 4.33/unit
```

**Final State:**
```
┌─────────────────────────┐
│ Item: Steel Wheel       │
│ Quantity: 30 units      │
│ Avg Price: Rs 4.33/unit │
│ Total Value: Rs 130     │
└─────────────────────────┘
```

**✅ Verification:**
- Total value is preserved: Rs 50 (old) + Rs 80 (new) = Rs 130 (total)
- Average reflects the weighted cost of both purchases

---

### Example 3: Multiple Additions

**Scenario:** Three separate purchases at different prices

**Step 1:** Opening Stock
```
Add: 10 units @ Rs 5/unit
Result: 10 units @ Rs 5/unit (total: Rs 50)
```

**Step 2:** First Purchase
```
Current: 10 units @ Rs 5/unit (Rs 50)
Add: 20 units @ Rs 4/unit (Rs 80)
Formula: (50 + 80) / 30 = Rs 4.33/unit
Result: 30 units @ Rs 4.33/unit (total: Rs 130)
```

**Step 3:** Second Purchase
```
Current: 30 units @ Rs 4.33/unit (Rs 130)
Add: 15 units @ Rs 6/unit (Rs 90)
Formula: (130 + 90) / 45 = Rs 4.89/unit
Result: 45 units @ Rs 4.89/unit (total: Rs 220)
```

**Summary Table:**

| Step | Action | Quantity | Unit Price | Avg Price | Total Value |
|------|--------|----------|------------|-----------|-------------|
| 0 | Initial | 0 | Rs 0 | Rs 0 | Rs 0 |
| 1 | Add 10 @ Rs 5 | 10 | Rs 5 | Rs 5.00 | Rs 50 |
| 2 | Add 20 @ Rs 4 | 30 | Rs 4 | Rs 4.33 | Rs 130 |
| 3 | Add 15 @ Rs 6 | 45 | Rs 6 | Rs 4.89 | Rs 220 |

---

### Example 4: Removing Stock (Average Unchanged)

**Initial State:**
```
┌─────────────────────────┐
│ Item: Steel Wheel       │
│ Quantity: 30 units      │
│ Avg Price: Rs 4.33/unit │
│ Total Value: Rs 130     │
└─────────────────────────┘
```

**Action:** Remove 5 units (damaged)
```
POST /items/1/adjust-stock
{
  "quantity": -5,
  "unit_price": 0,
  "reason": "Damaged during storage"
}
```

**Calculation:**
```
❌ NO CALCULATION!

When removing stock, the average price REMAINS UNCHANGED.
We're removing existing stock that was purchased at the average price.
```

**Final State:**
```
┌─────────────────────────┐
│ Item: Steel Wheel       │
│ Quantity: 25 units      │
│ Avg Price: Rs 4.33/unit │ ← UNCHANGED
│ Total Value: Rs 108.25  │ ← Automatically recalculated
└─────────────────────────┘
```

**Key Points:**
- ✅ Average price stays at Rs 4.33/unit
- ✅ Only quantity changes: 30 → 25
- ✅ Total value recalculated: 25 × 4.33 = Rs 108.25
- ✅ unit_price in request is ignored for removals

---

### Example 5: Removing All Stock (Reset to Zero)

**Initial State:**
```
┌─────────────────────────┐
│ Item: Steel Wheel       │
│ Quantity: 25 units      │
│ Avg Price: Rs 4.33/unit │
│ Total Value: Rs 108.25  │
└─────────────────────────┘
```

**Action:** Remove all remaining stock
```
POST /items/1/adjust-stock
{
  "quantity": -25,
  "unit_price": 0,
  "reason": "Stock clearance"
}
```

**Special Rule:**
```
When quantity reaches 0, reset avg_price to 0
```

**Final State:**
```
┌─────────────────────────┐
│ Item: Steel Wheel       │
│ Quantity: 0 units       │
│ Avg Price: Rs 0/unit    │ ← RESET to 0
│ Total Value: Rs 0       │
└─────────────────────────┘
```

**Why Reset?**
- Item is back to initial state (no stock)
- When adding new stock, we want to start fresh
- Prevents confusion with old pricing

---

## 🎓 Why Weighted Average?

### Problem: Different Purchase Prices

You buy the same item at different times with different prices:
- **Batch 1:** 10 units @ Rs 5/unit = Rs 50
- **Batch 2:** 20 units @ Rs 4/unit = Rs 80

**Question:** What's the average price per unit?

### ❌ Wrong Approach: Simple Average

```
(5 + 4) / 2 = Rs 4.5/unit

Total value check:
30 units × Rs 4.5 = Rs 135

But we only paid: Rs 50 + Rs 80 = Rs 130
❌ This gives wrong total value!
```

### ✅ Correct Approach: Weighted Average

```
(10 × 5 + 20 × 4) / 30 = Rs 4.33/unit

Total value check:
30 units × Rs 4.33 = Rs 130

This matches what we actually paid!
✅ Total value is preserved!
```

---

## 🧮 Real-World Scenarios

### Scenario 1: Inflation

**Month 1:** Buy 100 pencils @ Rs 2/pencil = Rs 200
**Month 2:** Buy 100 pencils @ Rs 3/pencil = Rs 300 (price increased!)

**Without Weighted Average:**
- You might think average = Rs 2.5/pencil
- Total value = 200 × 2.5 = Rs 500 ❌ Wrong!
- You actually paid Rs 500, so it matches by coincidence here

**With Weighted Average:**
- Average = (100×2 + 100×3) / 200 = Rs 2.5/pencil
- Total value = 200 × 2.5 = Rs 500 ✅ Correct!

---

### Scenario 2: Bulk Purchase Discount

**Purchase 1:** 10 units @ Rs 10/unit = Rs 100 (regular price)
**Purchase 2:** 90 units @ Rs 8/unit = Rs 720 (bulk discount!)

**Without Weighted Average:**
- Simple average = (10 + 8) / 2 = Rs 9/unit
- Total value = 100 × 9 = Rs 900 ❌ Wrong!
- You actually paid Rs 820

**With Weighted Average:**
- Average = (10×10 + 90×8) / 100 = Rs 8.2/unit
- Total value = 100 × 8.2 = Rs 820 ✅ Correct!

**Benefit:**
- Average Rs 8.2 reflects that most items were bought at discount
- Not the simple average of Rs 9

---

## 📈 Stock Flow Example

Let's track a complete lifecycle:

```
┌──────────────────────────────────────────────────────────────┐
│                    ITEM: USB CABLE                            │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  DAY 1: Create Item                                          │
│  ├─ Quantity: 0 units                                        │
│  ├─ Avg Price: Rs 0/unit                                     │
│  └─ Total Value: Rs 0                                        │
│                                                               │
│  DAY 2: Opening Stock                                        │
│  ├─ Add 100 @ Rs 2.5 = Rs 250                               │
│  ├─ Quantity: 100 units                                      │
│  ├─ Avg Price: Rs 2.5/unit                                   │
│  └─ Total Value: Rs 250                                      │
│                                                               │
│  DAY 5: Purchase                                             │
│  ├─ Add 50 @ Rs 3.0 = Rs 150                                │
│  ├─ Calc: (250 + 150) / 150 = Rs 2.67/unit                  │
│  ├─ Quantity: 150 units                                      │
│  ├─ Avg Price: Rs 2.67/unit                                  │
│  └─ Total Value: Rs 400                                      │
│                                                               │
│  DAY 7: Sale (removed from inventory)                        │
│  ├─ Remove 80 units                                          │
│  ├─ Quantity: 70 units                                       │
│  ├─ Avg Price: Rs 2.67/unit (unchanged)                      │
│  └─ Total Value: Rs 186.90                                   │
│                                                               │
│  DAY 10: Damaged                                             │
│  ├─ Remove 10 units                                          │
│  ├─ Quantity: 60 units                                       │
│  ├─ Avg Price: Rs 2.67/unit (unchanged)                      │
│  └─ Total Value: Rs 160.20                                   │
│                                                               │
│  DAY 15: Restock                                             │
│  ├─ Add 40 @ Rs 2.8 = Rs 112                                │
│  ├─ Calc: (160.20 + 112) / 100 = Rs 2.72/unit               │
│  ├─ Quantity: 100 units                                      │
│  ├─ Avg Price: Rs 2.72/unit                                  │
│  └─ Total Value: Rs 272.20                                   │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

---

## ✅ Validation Rules

### When Adding Stock (quantity > 0)

✅ **Required:**
- `unit_price` must be provided
- `unit_price` must be > 0

✅ **Calculation:**
- Weighted average formula is applied
- Total value is preserved

### When Removing Stock (quantity < 0)

✅ **Required:**
- Cannot remove more than available quantity

✅ **Behavior:**
- `unit_price` is ignored (can be 0)
- Average price remains unchanged
- Exception: Reset to 0 when stock reaches zero

### Edge Cases Handled

✅ **Zero Stock:**
- When quantity = 0, avg_price = 0
- Clean slate for next stock addition

✅ **Decimal Precision:**
- Uses Prisma Decimal type for accuracy
- Avoids floating-point errors
- Consistent rounding

✅ **Transaction Safety:**
- Item update and adjustment record created atomically
- No partial updates if something fails

---

## 🎯 Quick Reference

| Situation | Formula | Example |
|-----------|---------|---------|
| First stock addition | unit_price becomes avg_price | 10 @ Rs 5 → avg = Rs 5 |
| Add more stock | Weighted average | 10@Rs5 + 20@Rs4 → avg = Rs 4.33 |
| Remove stock | Keep same avg_price | Remove 5 from 30@Rs4.33 → avg = Rs 4.33 |
| Remove all stock | Reset avg_price to 0 | Remove 25 from 25@Rs4.33 → avg = Rs 0 |

---

## 🔢 Calculator Examples

### Example A
```
Current: 15 units @ Rs 10/unit
Add: 35 units @ Rs 8/unit
Formula: (15 × 10 + 35 × 8) / (15 + 35)
       = (150 + 280) / 50
       = 430 / 50
       = Rs 8.6/unit
Result: 50 units @ Rs 8.6/unit = Rs 430
```

### Example B
```
Current: 8 units @ Rs 25/unit
Add: 12 units @ Rs 20/unit
Formula: (8 × 25 + 12 × 20) / (8 + 12)
       = (200 + 240) / 20
       = 440 / 20
       = Rs 22/unit
Result: 20 units @ Rs 22/unit = Rs 440
```

### Example C
```
Current: 100 units @ Rs 15/unit
Add: 25 units @ Rs 12/unit
Formula: (100 × 15 + 25 × 12) / (100 + 25)
       = (1500 + 300) / 125
       = 1800 / 125
       = Rs 14.4/unit
Result: 125 units @ Rs 14.4/unit = Rs 1800
```

---

## 📚 Further Reading

**Why This Matters:**
- **Accurate Inventory Valuation:** Know the true cost of your inventory
- **Profit Calculation:** Selling price - avg_price = actual profit
- **Financial Reporting:** Accurate COGS (Cost of Goods Sold)
- **Decision Making:** Know if you're making profit on each sale

**Industry Standard:**
- This is called **Weighted Average Cost (WAC)** method
- Commonly used in inventory management systems
- Alternative methods: FIFO, LIFO (not used in this system)

---

**Implementation Complete!** 🎉

All calculations are handled automatically by the `adjustStock()` method in `ItemService`.
