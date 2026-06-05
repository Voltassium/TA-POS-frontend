# TA POS Backend — API Documentation

Default local backend: `localhost:8080`
Base path: `/v1`

This document describes the HTTP API exposed by the TA POS backend so the frontend can implement the client-side integration. Use `Authorization: Bearer <access_token>` for protected endpoints. JSON is used for request/response bodies unless noted.

---

## Conventions

- Base URL prefix for all endpoints: `/v1`
- Protected endpoints require `Authorization` header: `Authorization: Bearer <access_token>`
- JSON request bodies: `Content-Type: application/json`
- File uploads: `Content-Type: multipart/form-data` and form field `file`
- List endpoints support pagination query params: `page`, `page_size`, `order_by`, `order_dir`
- Responses use the wrapper format:

```json
{
  "status": 200,
  "message": "OK",
  "data": { /* response payload */ },
  "error": null
}
```

Error responses use the same wrapper with `error` populated. Validation errors and app errors return appropriate HTTP status codes (400, 401, 403, 404, 500).

---

## Enums / Constants

### User Roles
- `admin`
- `staff`

### Order Status
- `Open` — Order created, items can be added/removed.
- `Paid` — Order paid. Kitchen can now track item served quantities.
- `Ready` — All items in the order have been fully served to the customer.
- `Cancelled` — Order has been cancelled.

### Payment Methods
- `Cash`
- `Card`
- `Digital Wallet`

### Discount Types
- `percentage` — Reduces price by a percentage of the base price (e.g., `10.0` for 10%).
- `fixed` — Reduces price by a fixed monetary value (e.g., `5000.0` for IDR 5,000).

These values are validated server-side. Use them exactly (case sensitive).

---

## Authentication

### Register
- Method: `POST`
- Path: `/v1/authentications/register`
- Auth: none
- Request JSON:

```json
{
  "email": "user@example.com",
  "password": "secret",
  "role": "staff" // optional: "admin" or "staff" (defaults to "staff")
}
```
- Validation: `email` required and must be a valid email; `password` required.
- Response: `201 Created` wrapper. `data` is `null`.

### Login
- Method: `POST`
- Path: `/v1/authentications/login`
- Auth: none
- Request JSON:

```json
{
  "email": "user@example.com",
  "password": "secret"
}
```
- Response: `200 OK` with `data`:

```json
{
  "access_token": "<jwt_access>",
  "refresh_token": "<jwt_refresh>"
}
```

Usage: Include `access_token` on protected calls as header `Authorization: Bearer <access_token>`.

### Refresh token
- Method: `POST`
- Path: `/v1/authentications/refresh-token`
- Auth: none
- Request JSON:

```json
{
  "refresh_token": "<jwt_refresh>"
}
```

- Response: `200 OK` with `data`:

```json
{ 
  "access_token": "<new_jwt_access>" 
}
```

### Logout
- Method: `POST`
- Path: `/v1/authentications/logout`
- Auth: Bearer access token
- Request body: none
- Response: `200 OK` wrapper (no data)

---

## Users

> [!IMPORTANT]
> All endpoints under `/v1/users` are restricted to the **admin** role. Non-admin users attempting to access these routes will receive a `403 Forbidden` response.

### List users
- Method: `GET`
- Path: `/v1/users`
- Auth: Bearer (admin only)
- Query params: pagination (`page`, `page_size`, `order_by`, `order_dir`)
- Response: `200 OK` pagination wrapper with user objects in `data`:

```json
{
  "id": 1,
  "email": "user@example.com",
  "role": "staff",
  "created_at": "2024-01-01T12:00:00Z",
  "updated_at": "2024-01-01T12:00:00Z"
}
```

### Get current profile
- Method: `GET`
- Path: `/v1/users/profile`
- Auth: Bearer (admin only due to route grouping middleware)
- Response: `200 OK` with a single user object (same shape as above).

### Get user by id
- Method: `GET`
- Path: `/v1/users/:id`
- Auth: Bearer (admin only)
- Response: `200 OK` with user object.

### Update user
- Method: `PUT`
- Path: `/v1/users/:id`
- Auth: Bearer (admin only)
- Request JSON (all fields optional):

```json
{
  "email": "new@example.com",
  "password": "newpassword",
  "role": "admin"
}
```

- Response: `200 OK` wrapper (no data).

### Delete user
- Method: `DELETE`
- Path: `/v1/users/:id`
- Auth: Bearer (admin only)
- Response: `200 OK` wrapper (no data).

---

## Stores

> [!NOTE]
> All store endpoints require authentication, but are accessible to both **admin** and **staff** roles.

### Create store
- Method: `POST`
- Path: `/v1/stores`
- Auth: Bearer (admin | staff)
- Request JSON:

```json
{
  "name": "Voltassium Store 1", // required
  "address": "Jl. Kaliurang KM 5, Yogyakarta" // optional
}
```
- Response: `201 Created` with `data` matching the created store object:

```json
{
  "id": 1,
  "name": "Voltassium Store 1",
  "address": "Jl. Kaliurang KM 5, Yogyakarta",
  "created_at": "2026-06-05T19:00:00Z",
  "updated_at": "2026-06-05T19:00:00Z"
}
```

### List stores
- Method: `GET`
- Path: `/v1/stores`
- Auth: Bearer (admin | staff)
- Query params: pagination (`page`, `page_size`, `order_by`, `order_dir`)

> [!WARNING]
> This endpoint returns a custom pagination structure that differs from the default pagination response. Note the nested `data` and `meta` keys inside the `data` wrapper.

- Response: `200 OK` with custom pagination data:

```json
{
  "status": 200,
  "message": "Stores listed successfully",
  "data": {
    "data": [
      {
        "id": 1,
        "name": "Voltassium Store 1",
        "address": "Jl. Kaliurang KM 5, Yogyakarta",
        "created_at": "2026-06-05T19:00:00Z",
        "updated_at": "2026-06-05T19:00:00Z"
      }
    ],
    "meta": {
      "total": 1,
      "page": 1,
      "page_size": 10
    }
  },
  "error": null
}
```

### Get store by id
- Method: `GET`
- Path: `/v1/stores/:id`
- Auth: Bearer (admin | staff)
- Response: `200 OK` with the store object.

### Update store
- Method: `PUT`
- Path: `/v1/stores/:id`
- Auth: Bearer (admin | staff)
- Request JSON (fields optional):

```json
{
  "name": "Voltassium Store 1 Updated",
  "address": "Jl. Kaliurang KM 6, Yogyakarta"
}
```
- Response: `200 OK` with the updated store object.

### Delete store
- Method: `DELETE`
- Path: `/v1/stores/:id`
- Auth: Bearer (admin | staff)
- Response: `200 OK` wrapper (no data).

---

## Categories

### List categories
- Method: `GET`
- Path: `/v1/categories`
- Auth: Bearer (admin | staff)
- Query params: pagination
- Response: `200 OK` standard pagination wrapper; items have shape:

```json
{
  "id": 1,
  "name": "Beverages",
  "image_url": "https://...",
  "created_at": "...",
  "updated_at": "..."
}
```

### Get category by id
- Method: `GET`
- Path: `/v1/categories/:id`
- Auth: Bearer (admin | staff)
- Response: `200 OK` with category object.

### Create category
- Method: `POST`
- Path: `/v1/categories`
- Auth: Bearer (admin only)
- Request JSON:

```json
{
  "name": "Beverages",
  "image_url": "https://.../image.jpg" // optional
}
```
- Response: `201 Created` with created category details.

### Update category
- Method: `PUT`
- Path: `/v1/categories/:id`
- Auth: Bearer (admin only)
- Request JSON (fields optional):

```json
{ 
  "name": "Drinks", 
  "image_url": "https://..." 
}
```
- Response: `200 OK` wrapper (no data).

### Delete category
- Method: `DELETE`
- Path: `/v1/categories/:id`
- Auth: Bearer (admin only)
- Response: `200 OK` wrapper (no data).

---

## Products

### List products
- Method: `GET`
- Path: `/v1/products`
- Auth: Bearer (admin | staff)
- Query params: pagination + optional `category_id` (integer) filter.
- Response: `200 OK` standard pagination wrapper with product items:

```json
{
  "id": 10,
  "category_id": 1,
  "category_name": "Beverages",
  "name": "Americano",
  "description": "Hot coffee",
  "price": 18000.0,
  "is_available": true,
  "stock": 50,
  "created_at": "...",
  "updated_at": "..."
}
```

### Get product by id
- Method: `GET`
- Path: `/v1/products/:id`
- Auth: Bearer (admin | staff)
- Response: `200 OK` with product object.

### Get product stock histories
- Method: `GET`
- Path: `/v1/products/:id/stock-histories`
- Auth: Bearer (admin | staff)
- Query params: pagination
- Response: `200 OK` standard pagination wrapper of stock history items:

```json
{
  "id": 1,
  "product_id": 10,
  "product_name": "Americano",
  "change": -2,
  "reason": "Order #123 Paid",
  "created_at": "..."
}
```

### Create product
- Method: `POST`
- Path: `/v1/products`
- Auth: Bearer (admin only)
- Request JSON:

```json
{
  "category_id": 1,
  "name": "Americano",
  "description": "Hot coffee", // optional
  "price": 18000.0, // must be > 0
  "is_available": true, // optional (defaults to true)
  "stock": 50 // optional (defaults to 0, must be >= 0)
}
```
- Response: `201 Created` with created product object.

### Update product
- Method: `PUT`
- Path: `/v1/products/:id`
- Auth: Bearer (admin only)
- Request JSON (fields optional):

```json
{
  "category_id": 1,
  "name": "Ice Americano",
  "description": "Iced black coffee",
  "price": 20000.0,
  "is_available": true,
  "stock": 48
}
```
- Response: `200 OK` wrapper.

### Delete product
- Method: `DELETE`
- Path: `/v1/products/:id`
- Auth: Bearer (admin only)
- Response: `200 OK` wrapper.

---

## Stock Histories

### List all stock histories
- Method: `GET`
- Path: `/v1/stock-histories`
- Auth: Bearer (admin | staff)
- Query params: pagination + optional `product_id` (integer) filter.
- Response: `200 OK` standard pagination wrapper of stock history items (same shape as product-specific stock histories).

---

## Orders

### Create order
- Method: `POST`
- Path: `/v1/orders`
- Auth: Bearer (admin | staff)
- Request JSON:

```json
{
  "table_id": 12, // optional (nullable)
  "discount_type": "percentage", // optional: "percentage" or "fixed"
  "discount_value": 10.0, // optional
  "items": [ // optional inline items addition
    {
      "product_id": 10,
      "quantity": 2,
      "discount_type": "fixed", // optional
      "discount_value": 1000.0 // optional
    }
  ]
}
```
- Response: `201 Created` with `data` containing basic order summary:

```json
{
  "id": 123,
  "table_id": 12,
  "staff_id": 5,
  "total_amount": 34000.0,
  "discount_type": "percentage",
  "discount_value": 10.0,
  "discount_amount": 3600.0,
  "status": "Open",
  "created_at": "...",
  "updated_at": "..."
}
```

### List orders
- Method: `GET`
- Path: `/v1/orders`
- Auth: Bearer (admin | staff)
- Query params: pagination + optional `status` (Open/ Paid/ Cancelled/ Ready) + optional `exclude_status` (Open/ Paid/ Cancelled/ Ready)
- Response: `200 OK` standard pagination wrapper of order summary objects.

### Get order detail
- Method: `GET`
- Path: `/v1/orders/:id`
- Auth: Bearer (admin | staff)
- Response: `200 OK` with full order detail, including items (with served quantities) and optional payment info:

```json
{
  "id": 123,
  "table_id": 12,
  "staff_id": 5,
  "total_amount": 34000.0,
  "discount_type": "percentage",
  "discount_value": 10.0,
  "discount_amount": 3600.0,
  "status": "Paid",
  "created_at": "...",
  "updated_at": "...",
  "items": [
    {
      "id": 1,
      "order_id": 123,
      "product_id": 10,
      "product_name": "Americano",
      "quantity": 2,
      "unit_price": 18000.0,
      "discount_type": "fixed",
      "discount_value": 1000.0,
      "discount_amount": 2000.0,
      "subtotal": 34000.0,
      "served_qty": 0,
      "created_at": "...",
      "updated_at": "..."
    }
  ],
  "payment": {
    "id": 45,
    "order_id": 123,
    "payment_method": "Cash",
    "amount_paid": 40000.0,
    "timestamp": "..."
  }
}
```

### Update order status
- Method: `PATCH`
- Path: `/v1/orders/:id/status`
- Auth: Bearer (admin | staff)
- Request JSON:

```json
{ 
  "status": "Paid" // must be valid OrderStatus enum value
}
```
- Response: `200 OK` wrapper.

### Cancel order
- Method: `DELETE`
- Path: `/v1/orders/:id`
- Auth: Bearer (admin | staff)
- Response: `200 OK` wrapper (status is changed to `Cancelled` server-side, restoring stock counts).

---

## Order Items & Kitchen Operations

### Add item to order
- Method: `POST`
- Path: `/v1/orders/:id/items`
- Auth: Bearer (admin | staff)
- Request JSON:

```json
{ 
  "product_id": 42, 
  "quantity": 2,
  "discount_type": "percentage", // optional
  "discount_value": 5.0 // optional
}
```
- Response: `200 OK` with refreshed `OrderDetail` object.

### Remove item from order
- Method: `DELETE`
- Path: `/v1/orders/:id/items/:item_id`
- Auth: Bearer (admin | staff)
- Response: `200 OK` with refreshed `OrderDetail` object.

### Kitchen: Update item served quantity
- Method: `PATCH`
- Path: `/v1/orders/:id/items/:item_id/served`
- Auth: Bearer (admin | staff)
- Request JSON:

```json
{
  "served_qty": 2 // must be between 0 and order item quantity
}
```

> [!NOTE]
> - This endpoint is only allowed on orders with `Paid` status.
> - If updating this item causes all items in the order to be fully served (i.e. `served_qty == quantity` for all items), the order's status will be automatically updated to `Ready` on the server.

- Response: `200 OK` with refreshed `OrderDetail` object showing updated served quantities and status.

---

## Payments

### Create payment
- Method: `POST`
- Path: `/v1/payments`
- Auth: Bearer (admin | staff)
- Request JSON:

```json
{
  "order_id": 123,
  "payment_method": "Cash", // Cash | Card | Digital Wallet
  "amount_paid": 40000.0 // must be >= total_amount
}
```
- Response: `201 Created` with created payment object:

```json
{
  "id": 45,
  "order_id": 123,
  "payment_method": "Cash",
  "amount_paid": 40000.0,
  "timestamp": "2026-06-05T19:15:00Z"
}
```

### Get payment by order ID
- Method: `GET`
- Path: `/v1/payments/:order_id`
- Auth: Bearer (admin | staff)
- Response: `200 OK` with the payment object.

---

## Statistics

### Get dashboard data
- Method: `GET`
- Path: `/v1/statistics/dashboard`
- Auth: Bearer (admin only)
- Response: `200 OK` with dashboard stats:

```json
{
  "stats": {
    "total_orders": 150,
    "total_revenue": 3500000.0
  },
  "sales_chart": [
    { "date": "2026-06-04", "total": 1200000.0 },
    { "date": "2026-06-05", "total": 2300000.0 }
  ],
  "top_products": [
    {
      "product_id": 10,
      "product_name": "Americano",
      "category_name": "Beverages",
      "quantity": 45
    }
  ]
}
```

---

## Misc

### Ping
- Method: `GET`
- Path: `/v1/ping`
- Auth: none
- Response: `200 OK` with server time and user-agent.

### File upload (object storage)
- Method: `POST`
- Path: `/v1/upload` (Confirm with backend configurations if routes are enabled)
- Auth: Bearer (admin | staff)
- Request: `multipart/form-data` with form field name `file` (max size enforced by server settings).
- Response: `200 OK` with upload details:

```json
{
  "filename": "1717588800_image.jpg",
  "path": "uploads/1717588800_image.jpg"
}
```

---

## Pagination details

All endpoints returning list wrappers (excluding Store List) support pagination via these query parameters:

- `page` (int) — page number (defaults to 1; values < 1 are treated as 1)
- `page_size` (int) — items per page (defaults to 10)
- `order_by` (string) — column to sort by (defaults to `updated_at`)
- `order_dir` (string) — sort direction (either `desc` or `asc`; defaults to `desc`)

These list endpoints return a pagination envelope structured as follows:

```json
{
  "current_page": 1,
  "page_size": 10,
  "total_items": 123,
  "total_pages": 13,
  "has_previous": false,
  "has_next": true,
  "data": [ /* Array of items */ ]
}
```

---

## Error handling & common responses

The backend utilizes standard HTTP status codes combined with a consistent JSON envelope to communicate error details.

- **400 Bad Request**: Validation errors or business logic violations (e.g. invalid payload fields, updating items on a cancelled order).
- **401 Unauthorized**: Missing, expired, or malformed JWT token in `Authorization` header.
- **403 Forbidden**: Authenticated user role lacks sufficient privileges for the target endpoint.
- **404 Not Found**: Target resource (e.g. category, product, order) does not exist.
- **500 Internal Server Error**: Unexpected server-side issues.

### Example validation error response (400)

```json
{
  "status": 400,
  "message": "Bad Request",
  "data": null,
  "error": {
    "field": "email",
    "message": "email is required"
  }
}
```

---

## Quick cURL examples

### Login
```bash
curl -X POST http://localhost:8080/v1/authentications/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"secret"}'
```

### Create Store (admin/staff)
```bash
curl -X POST http://localhost:8080/v1/stores \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"name":"Yogyakarta Branch","address":"Jl. Malioboro"}'
```

### Create Order with Inline Items and Discount (admin/staff)
```bash
curl -X POST http://localhost:8080/v1/orders \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "table_id": 5,
    "discount_type": "percentage",
    "discount_value": 10.0,
    "items": [
      {"product_id": 10, "quantity": 3, "discount_type": "fixed", "discount_value": 500.0}
    ]
  }'
```

### Kitchen: Serve Order Item (admin/staff)
```bash
curl -X PATCH http://localhost:8080/v1/orders/123/items/1/served \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"served_qty":3}'
```

### Create Payment (admin/staff)
```bash
curl -X POST http://localhost:8080/v1/payments \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"order_id":123,"payment_method":"Cash","amount_paid":50000.0}'
```

---

## Implementation notes for frontend

- **Validations**: Always perform simple input validation client-side before sending requests, but expect and handle validation errors (400) returned by server-side constraints.
- **Role Restrictions**: Ensure sections of the UI only accessible to admins (e.g. User Management, Category/Product creation) are hidden or disabled for users with the `staff` role.
- **Refresh Flow**: Intercept 401 responses to trigger a token refresh using the stored `refresh_token` at `/v1/authentications/refresh-token`. If that fails, clear local session state and redirect to the login page.
- **Status Workflows**: Update local order lists dynamically when kitchen items are served. When receiving a webhook or checking order details, transition orders to `Ready` once all items are dished out.