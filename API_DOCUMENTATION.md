# Power Genix API - Complete Documentation

## Base URL
```
http://localhost:3333/api/v1
```

## Interactive Documentation
```
http://localhost:3333/api/docs
```

---

## Table of Contents

1. [Authentication](#authentication)
2. [Customers](#customers)
3. [Suppliers](#suppliers)
4. [Categories](#categories)
5. [Items & Inventory](#items--inventory)
6. [Expense Categories](#expense-categories)
7. [Expenses](#expenses)
8. [Recipes](#recipes)
9. [Production](#production)
10. [Purchase Invoices](#purchase-invoices)
11. [Payments](#payments)
12. [Accounts & Ledger](#accounts--ledger)

---

## Authentication

### Register User
**POST** `/auth/register`

**Public endpoint** - No authentication required

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123",
  "name": "John Doe",
  "phone": "+1234567890"
}
```

**Response:** `201 Created`
```json
{
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "John Doe",
    "phone": "+1234567890",
    "role": "ADMIN",
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  },
  "tokens": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

### Login
**POST** `/auth/login`

**Public endpoint** - No authentication required

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123"
}
```

**Response:** `200 OK`
```json
{
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "John Doe",
    "phone": "+1234567890",
    "role": "ADMIN",
    "isActive": true
  },
  "tokens": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

### Refresh Token
**POST** `/auth/refresh`

**Public endpoint** - No authentication required

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response:** `200 OK`
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

### Get Profile
**GET** `/auth/profile`

**Protected** - Requires Bearer token

**Headers:**
```
Authorization: Bearer YOUR_ACCESS_TOKEN
```

**Response:** `200 OK`
```json
{
  "id": 1,
  "email": "user@example.com",
  "name": "John Doe",
  "phone": "+1234567890",
  "role": "ADMIN",
  "isActive": true,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

---

## Customers

All customer endpoints require Bearer token authentication.

### Create Customer
**POST** `/customers`

**Request Body:**
```json
{
  "name": "ABC Corporation",
  "email": "contact@abc.com",
  "phone": "+1234567890",
  "address": "123 Main St, City, Country"
}
```

**Response:** `201 Created`

---

### Get All Customers
**GET** `/customers?page=1&limit=10`

**Query Parameters:**
- `page` (optional, default: 1) - Page number
- `limit` (optional, default: 10) - Items per page

**Response:** `200 OK`
```json
{
  "data": [
    {
      "id": 1,
      "name": "ABC Corporation",
      "email": "contact@abc.com",
      "phone": "+1234567890",
      "address": "123 Main St, City, Country",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "totalPages": 3
  }
}
```

---

### Get Customer by ID
**GET** `/customers/{id}`

**Response:** `200 OK`

---

### Update Customer
**PATCH** `/customers/{id}`

**Request Body:**
```json
{
  "name": "ABC Corporation Updated",
  "phone": "+9876543210"
}
```

**Response:** `200 OK`

---

### Delete Customer
**DELETE** `/customers/{id}`

**Response:** `200 OK`

---

## Suppliers

All supplier endpoints require Bearer token authentication.

### Create Supplier
**POST** `/suppliers`

**Request Body:**
```json
{
  "name": "XYZ Supplies Ltd",
  "email": "sales@xyz.com",
  "phone": "+1234567890",
  "address": "456 Industrial Ave, City, Country"
}
```

**Response:** `201 Created`

---

### Get All Suppliers
**GET** `/suppliers?page=1&limit=10`

**Response:** `200 OK` (Paginated response similar to customers)

---

### Get Supplier by ID
**GET** `/suppliers/{id}`

**Response:** `200 OK`

---

### Get Supplier Statement
**GET** `/suppliers/{id}/statement`

**Description:** Get complete supplier statement including all purchase invoices, payments, and outstanding balance.

**Response:** `200 OK`
```json
{
  "supplier": {
    "id": 1,
    "name": "XYZ Supplies Ltd",
    "email": "sales@xyz.com",
    "phone": "+1234567890"
  },
  "purchaseInvoices": [
    {
      "id": 1,
      "invoiceNumber": "PI-001",
      "invoiceDate": "2024-01-01",
      "totalAmount": 10000,
      "paidAmount": 5000,
      "balanceAmount": 5000
    }
  ],
  "payments": [
    {
      "id": 1,
      "paymentDate": "2024-01-15",
      "amount": 5000,
      "paymentMethod": "BANK_TRANSFER"
    }
  ],
  "summary": {
    "totalPurchases": 10000,
    "totalPaid": 5000,
    "outstandingBalance": 5000
  }
}
```

---

### Update Supplier
**PATCH** `/suppliers/{id}`

**Response:** `200 OK`

---

### Delete Supplier
**DELETE** `/suppliers/{id}`

**Response:** `200 OK`

---

## Categories

All category endpoints require Bearer token authentication.

### Create Category
**POST** `/categories`

**Request Body:**
```json
{
  "name": "Raw Materials"
}
```

**Response:** `201 Created`

---

### Get All Categories
**GET** `/categories?page=1&limit=10`

**Response:** `200 OK` (Paginated)

---

### Get Category by ID
**GET** `/categories/{id}`

**Response:** `200 OK`

---

### Update Category
**PATCH** `/categories/{id}`

**Response:** `200 OK`

---

### Delete Category
**DELETE** `/categories/{id}`

**Response:** `200 OK`

---

## Items & Inventory

All item endpoints require Bearer token authentication.

### Create Item
**POST** `/items`

**Description:** Create a new item WITHOUT stock (quantity=0, avg_price=0). Use adjust-stock endpoint to add stock.

**Request Body:**
```json
{
  "name": "Premium Flour",
  "category_id": 1,
  "item_type": "RAW"
}
```

**Item Types:**
- `RAW` - Raw material
- `FINAL` - Finished product

**Response:** `201 Created`

---

### Get All Items
**GET** `/items?page=1&limit=10&search=flour&item_type=RAW&category_id=1&stock_status=in_stock`

**Query Parameters:**
- `page` (optional, default: 1)
- `limit` (optional, default: 10)
- `search` (optional) - Search by item name
- `item_type` (optional) - Filter by `RAW` or `FINAL`
- `category_id` (optional) - Filter by category
- `stock_status` (optional) - `in_stock` or `out_of_stock`

**Response:** `200 OK` (Paginated)
```json
{
  "data": [
    {
      "id": 1,
      "name": "Premium Flour",
      "category_id": 1,
      "item_type": "RAW",
      "quantity": 100,
      "avg_price": 50,
      "category": {
        "id": 1,
        "name": "Raw Materials"
      }
    }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "totalPages": 5
  }
}
```

---

### Get Item by ID
**GET** `/items/{id}`

**Response:** `200 OK`

---

### Get Stock Information
**GET** `/items/{id}/stock`

**Response:** `200 OK`
```json
{
  "itemId": 1,
  "itemName": "Premium Flour",
  "currentQuantity": 100,
  "averagePrice": 50,
  "totalValue": 5000,
  "lastUpdated": "2024-01-15T10:30:00.000Z"
}
```

---

### Get Stock History
**GET** `/items/{id}/stock-history?page=1&limit=10`

**Response:** `200 OK` (Paginated)
```json
{
  "data": [
    {
      "id": 1,
      "itemId": 1,
      "adjustmentType": "PURCHASE",
      "quantity": 50,
      "price": 48,
      "totalCost": 2400,
      "reason": "Stock received from supplier",
      "adjustedBy": "John Doe",
      "adjustedAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "totalPages": 3
  }
}
```

---

### Adjust Stock
**POST** `/items/{id}/adjust-stock`

**Description:** Manually adjust stock (add/remove) with automatic weighted average price calculation. When adding stock (quantity > 0), the average price is calculated using weighted average. When removing stock (quantity < 0), the average price remains unchanged.

**Request Body:**
```json
{
  "quantity": 50,
  "price": 48,
  "reason": "Stock received from supplier"
}
```

**For removing stock:**
```json
{
  "quantity": -10,
  "reason": "Damaged items removed"
}
```

**Response:** `200 OK`

---

### Update Item
**PATCH** `/items/{id}`

**Description:** Update item details (name, category_id ONLY - NOT quantity, avg_price, or item_type)

**Request Body:**
```json
{
  "name": "Premium Flour Updated",
  "category_id": 2
}
```

**Response:** `200 OK`

---

### Delete Item
**DELETE** `/items/{id}`

**Description:** Can only delete if quantity=0 AND no stock adjustment history exists

**Response:** `200 OK`

---

## Expense Categories

All expense category endpoints require Bearer token authentication.

### Create Expense Category
**POST** `/expense-categories`

**Request Body:**
```json
{
  "name": "Utilities",
  "description": "Electricity, water, internet, etc."
}
```

**Response:** `201 Created`

---

### Get All Expense Categories
**GET** `/expense-categories?page=1&limit=10`

**Response:** `200 OK` (Paginated)

---

### Get Expense Category by ID
**GET** `/expense-categories/{id}`

**Response:** `200 OK`

---

### Update Expense Category
**PATCH** `/expense-categories/{id}`

**Response:** `200 OK`

---

### Delete Expense Category
**DELETE** `/expense-categories/{id}`

**Response:** `200 OK`

---

## Expenses

All expense endpoints require Bearer token authentication.

### Create Expense
**POST** `/expenses`

**Request Body:**
```json
{
  "expense_category_id": 1,
  "account_id": 1,
  "amount": 500,
  "expense_date": "2024-01-15",
  "description": "Monthly electricity bill",
  "reference_number": "ELEC-JAN-2024"
}
```

**Response:** `201 Created`

---

### Create Bulk Expenses by Day
**POST** `/expenses/bulk-by-day`

**Description:** Create multiple expenses grouped by day

**Request Body:**
```json
{
  "expenses": [
    {
      "expense_category_id": 1,
      "account_id": 1,
      "amount": 500,
      "expense_date": "2024-01-15",
      "description": "Electricity"
    },
    {
      "expense_category_id": 2,
      "account_id": 1,
      "amount": 300,
      "expense_date": "2024-01-15",
      "description": "Internet"
    }
  ]
}
```

**Response:** `201 Created`

---

### Get All Expenses
**GET** `/expenses?page=1&limit=10&account_id=1&expense_category_id=1&from_date=2024-01-01&to_date=2024-01-31`

**Query Parameters:**
- `page`, `limit` - Pagination
- `account_id` (optional) - Filter by account
- `expense_category_id` (optional) - Filter by category
- `from_date` (optional) - Start date (YYYY-MM-DD)
- `to_date` (optional) - End date (YYYY-MM-DD)

**Response:** `200 OK` (Paginated)

---

### Get Expense by ID
**GET** `/expenses/{id}`

**Response:** `200 OK`

---

### Update Expense
**PATCH** `/expenses/{id}`

**Response:** `200 OK`

---

### Delete Expense
**DELETE** `/expenses/{id}`

**Response:** `200 OK`

---

## Recipes

All recipe endpoints require Bearer token authentication.

### Create Recipe
**POST** `/recipes`

**Request Body:**
```json
{
  "final_item_id": 5,
  "batch_quantity": 100,
  "recipe_ingredients": [
    {
      "raw_item_id": 1,
      "quantity": 50
    },
    {
      "raw_item_id": 2,
      "quantity": 30
    }
  ]
}
```

**Response:** `201 Created`

---

### Get All Recipes
**GET** `/recipes?page=1&limit=10`

**Response:** `200 OK` (Paginated)

---

### Get Recipe by ID
**GET** `/recipes/{id}`

**Response:** `200 OK`
```json
{
  "id": 1,
  "final_item_id": 5,
  "batch_quantity": 100,
  "final_item": {
    "id": 5,
    "name": "Bread Loaf",
    "item_type": "FINAL"
  },
  "recipe_ingredients": [
    {
      "id": 1,
      "raw_item_id": 1,
      "quantity": 50,
      "raw_item": {
        "id": 1,
        "name": "Flour",
        "avg_price": 50
      }
    }
  ],
  "totalCost": 2500,
  "costPerUnit": 25
}
```

---

### Update Recipe
**PATCH** `/recipes/{id}`

**Response:** `200 OK`

---

### Delete Recipe
**DELETE** `/recipes/{id}`

**Response:** `200 OK`

---

## Production

All production endpoints require Bearer token authentication.

### Create Production
**POST** `/production`

**Request Body:**
```json
{
  "recipe_id": 1,
  "batches": 5,
  "production_date": "2024-01-15",
  "notes": "Morning production batch"
}
```

**Response:** `201 Created`

---

### Get All Productions
**GET** `/production?page=1&limit=10&recipe_id=1&status=PENDING&from_date=2024-01-01&to_date=2024-01-31`

**Query Parameters:**
- `page`, `limit` - Pagination
- `recipe_id` (optional) - Filter by recipe
- `status` (optional) - `PENDING` or `COMPLETED`
- `from_date`, `to_date` (optional) - Date range

**Response:** `200 OK` (Paginated)

---

### Get Production by ID
**GET** `/production/{id}`

**Response:** `200 OK`

---

### Complete Production
**POST** `/production/{id}/complete`

**Description:** Mark production as complete and adjust stock (deduct raw materials, add final product)

**Request Body:**
```json
{
  "actual_batches": 5
}
```

**Response:** `200 OK`

---

### Update Production
**PATCH** `/production/{id}`

**Description:** Can only update if status is PENDING

**Response:** `200 OK`

---

### Delete Production
**DELETE** `/production/{id}`

**Description:** Can only delete if status is PENDING

**Response:** `200 OK`

---

## Purchase Invoices

All purchase invoice endpoints require Bearer token authentication.

### Create Purchase Invoice
**POST** `/purchase-invoices`

**Request Body:**
```json
{
  "supplier_id": 1,
  "account_id": 1,
  "invoice_number": "PI-2024-001",
  "invoice_date": "2024-01-15",
  "due_date": "2024-02-15",
  "notes": "Monthly raw material purchase",
  "items": [
    {
      "item_id": 1,
      "quantity": 100,
      "price": 50
    },
    {
      "item_id": 2,
      "quantity": 50,
      "price": 30
    }
  ]
}
```

**Response:** `201 Created`

---

### Get All Purchase Invoices
**GET** `/purchase-invoices?page=1&limit=10&supplier_id=1&account_id=1&payment_status=UNPAID&from_date=2024-01-01&to_date=2024-01-31`

**Query Parameters:**
- `page`, `limit` - Pagination
- `supplier_id` (optional)
- `account_id` (optional)
- `payment_status` (optional) - `PAID`, `PARTIAL`, or `UNPAID`
- `from_date`, `to_date` (optional)

**Response:** `200 OK` (Paginated)

---

### Get Purchase Invoice by ID
**GET** `/purchase-invoices/{id}`

**Response:** `200 OK`

---

### Get Purchase Invoice Summary
**GET** `/purchase-invoices/summary?from_date=2024-01-01&to_date=2024-01-31`

**Response:** `200 OK`
```json
{
  "totalInvoices": 50,
  "totalAmount": 500000,
  "totalPaid": 300000,
  "totalBalance": 200000,
  "paidInvoices": 20,
  "partialPaidInvoices": 15,
  "unpaidInvoices": 15
}
```

---

### Update Purchase Invoice
**PATCH** `/purchase-invoices/{id}`

**Response:** `200 OK`

---

### Delete Purchase Invoice
**DELETE** `/purchase-invoices/{id}`

**Response:** `200 OK`

---

## Payments

All payment endpoints require Bearer token authentication.

### Create Payment
**POST** `/payments`

**Request Body:**
```json
{
  "supplier_id": 1,
  "purchase_invoice_id": 1,
  "account_id": 1,
  "amount": 5000,
  "payment_date": "2024-01-20",
  "payment_method": "BANK_TRANSFER",
  "reference_number": "TXN-2024-001",
  "notes": "Partial payment for invoice PI-2024-001"
}
```

**Payment Methods:**
- `CASH`
- `BANK_TRANSFER`
- `CHEQUE`
- `CREDIT_CARD`
- `ONLINE`

**Response:** `201 Created`

---

### Get All Payments
**GET** `/payments?page=1&limit=10&supplier_id=1&purchase_invoice_id=1&account_id=1&from_date=2024-01-01&to_date=2024-01-31`

**Response:** `200 OK` (Paginated)

---

### Get Payment by ID
**GET** `/payments/{id}`

**Response:** `200 OK`

---

### Update Payment
**PATCH** `/payments/{id}`

**Response:** `200 OK`

---

### Delete Payment
**DELETE** `/payments/{id}`

**Response:** `200 OK`

---

## Accounts & Ledger

All account endpoints require Bearer token authentication.

### Create Account
**POST** `/accounts`

**Request Body:**
```json
{
  "name": "Main Cash Account",
  "account_type": "CASH",
  "opening_balance": 10000,
  "description": "Primary cash account for daily operations"
}
```

**Account Types:**
- `CASH`
- `BANK`
- `CREDIT_CARD`
- `OTHER`

**Response:** `201 Created`

---

### Get All Accounts
**GET** `/accounts?page=1&limit=10&account_type=CASH`

**Response:** `200 OK` (Paginated)

---

### Get Account by ID
**GET** `/accounts/{id}`

**Response:** `200 OK`

---

### Get Account Ledger
**GET** `/accounts/{id}/ledger?page=1&limit=20&from_date=2024-01-01&to_date=2024-01-31`

**Description:** Get complete ledger entries for an account

**Response:** `200 OK` (Paginated)
```json
{
  "data": [
    {
      "id": 1,
      "date": "2024-01-15",
      "description": "Payment to XYZ Supplies Ltd",
      "type": "PAYMENT",
      "debit": 5000,
      "credit": 0,
      "balance": 5000,
      "reference": "Payment #1"
    },
    {
      "id": 2,
      "date": "2024-01-16",
      "description": "Electricity Expense",
      "type": "EXPENSE",
      "debit": 500,
      "credit": 0,
      "balance": 4500,
      "reference": "Expense #1"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8,
    "openingBalance": 10000,
    "closingBalance": 4500
  }
}
```

---

### Get Account Balance
**GET** `/accounts/{id}/balance`

**Response:** `200 OK`
```json
{
  "accountId": 1,
  "accountName": "Main Cash Account",
  "accountType": "CASH",
  "openingBalance": 10000,
  "currentBalance": 4500,
  "totalDebit": 5500,
  "totalCredit": 0,
  "lastUpdated": "2024-01-16T14:30:00.000Z"
}
```

---

### Update Account
**PATCH** `/accounts/{id}`

**Description:** Can update name, description, and account_type only. Cannot modify opening_balance or current_balance.

**Response:** `200 OK`

---

### Delete Account
**DELETE** `/accounts/{id}`

**Description:** Can only delete if account has no transactions (ledger entries)

**Response:** `200 OK`

---

## Common Response Formats

### Success Response
```json
{
  "statusCode": 200,
  "message": "Success message",
  "data": { ... }
}
```

### Error Response
```json
{
  "statusCode": 400,
  "message": "Error message",
  "error": "Bad Request"
}
```

### Validation Error
```json
{
  "statusCode": 400,
  "message": [
    "email must be an email",
    "password must be longer than or equal to 8 characters"
  ],
  "error": "Bad Request"
}
```

---

## Status Codes

- `200 OK` - Successful GET, PATCH, or DELETE
- `201 Created` - Successful POST
- `400 Bad Request` - Invalid input data
- `401 Unauthorized` - Missing or invalid authentication
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `409 Conflict` - Resource conflict (e.g., duplicate email)
- `500 Internal Server Error` - Server error

---

## Authentication

Most endpoints require JWT authentication. Include the access token in the Authorization header:

```
Authorization: Bearer YOUR_ACCESS_TOKEN
```

Tokens expire after 7 days. Use the refresh token to get a new access token before it expires.

---

## Rate Limiting

Currently, there is no rate limiting implemented. This may be added in future versions.

---

## Pagination

All list endpoints support pagination with the following query parameters:

- `page` (default: 1) - Current page number
- `limit` (default: 10) - Items per page

Paginated responses include a `meta` object with:
- `page` - Current page
- `limit` - Items per page
- `total` - Total number of items
- `totalPages` - Total number of pages

---

## Best Practices

1. **Always use HTTPS in production**
2. **Store tokens securely** (never in localStorage for sensitive apps)
3. **Handle token expiration** gracefully
4. **Validate input** on the client side
5. **Use appropriate HTTP methods** (GET for reading, POST for creating, etc.)
6. **Handle errors** gracefully
7. **Keep refresh tokens secure**

---

## Support

For issues, questions, or feature requests, please open an issue on the repository.

---

**Last Updated:** February 2026  
**API Version:** 1.0
