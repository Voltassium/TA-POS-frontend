# TA POS Backend — API Documentation

Default local backend: `localhost:8080`
Base path: `/v1`

This document describes the HTTP API exposed by the TA POS backend so the frontend can implement the client-side integration. Use `Authorization: Bearer <access_token>` for protected endpoints. JSON is used for request/response bodies unless noted.

---

## Conventions

- Base URL prefix for all endpoints: `/v1`
- Protected endpoints require `Authorization` header: `Authorization: Bearer <access_token>`
- JSON request bodies: `Content-Type: application/json`
- File uploads (if used): `Content-Type: multipart/form-data` and form field `file` (see object storage controller)
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

- User roles: `admin`, `staff`
- Order status: `Open`, `Paid`, `Cancelled`
- Payment methods: `Cash`, `Card`, `Digital Wallet`

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
  "role": "staff" // optional: "admin" or "staff"
}
```
- Validation: `email` required and must be a valid email; `password` required.
- Response: `201 Created` (wrapper). `data` is `null` (server returns a success wrapper).

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
- Response: `200 OK` with `data` matching:

```json
{
  "access_token": "<jwt_access>",
  "refresh_token": "<jwt_refresh>"
}
```

Usage: include `access_token` on protected calls as header `Authorization: Bearer <access_token>`.

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
{ "access_token": "<new_jwt_access>" }
```

### Logout
- Method: `POST`
- Path: `/v1/authentications/logout`
- Auth: Bearer access token
- Request body: none
- Response: `200 OK` wrapper (no data)

---

## Users

All user endpoints are under `/v1/users`.

### List users
- Method: `GET`
- Path: `/v1/users`
- Auth: Bearer (admin only)
- Query params: pagination (`page`, `page_size`, `order_by`, `order_dir`)
- Response `200 OK` `data` is a pagination wrapper containing items like:

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
- Auth: Bearer (any authenticated user)
- Response: `200 OK` with a single user object (same shape as above)

### Get user by id
- Method: `GET`
- Path: `/v1/users/:id`
- Auth: Bearer (admin only)
- Response: `200 OK` with user object

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

- Response: `200 OK` wrapper (no data)

### Delete user
- Method: `DELETE`
- Path: `/v1/users/:id`
- Auth: Bearer (admin only)
- Response: `200 OK` wrapper (no data)

---

## Categories

Base path: `/v1/categories`.

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

- Response: `201 Created` with `data`:

```json
{
  "id": 1,
  "name": "Beverages",
  "image_url": "https://...",
  "created_at": "...",
  "updated_at": "..."
}
```

### Update category
- Method: `PUT`
- Path: `/v1/categories/:id`
- Auth: Bearer (admin only)
- Request JSON: (fields optional)

```json
{ "name": "Drinks", "image_url": "https://..." }
```

- Response: `200 OK` wrapper (no data)

### Delete category
- Method: `DELETE`
- Path: `/v1/categories/:id`
- Auth: Bearer (admin only)
- Response: `200 OK`

### List categories (public)
- Method: `GET`
- Path: `/v1/categories`
- Auth: none
- Query params: pagination
- Response: `200 OK` with pagination wrapper; items have shape:

```json
{
  "id": 1,
  "name": "Beverages",
  "image_url": "...",
  "created_at": "...",
  "updated_at": "..."
}
```

### Get category
- Method: `GET`
- Path: `/v1/categories/:id`
- Auth: none
- Response: `200 OK` with category object

---

## Products

Base path: `/v1/products`.

### Create product
- Method: `POST`
- Path: `/v1/products`
- Auth: Bearer (admin only)
- Request JSON:

```json
{
  "category_id": 1,
  "name": "Americano",
  "description": "Hot coffee",
  "price": 2.5,
  "is_available": true,
  "stock": 50
}
```

- Response: `201 Created` with `data` matching `response.Product`:

```json
{
  "id": 10,
  "category_id": 1,
  "category_name": "Beverages",
  "name": "Americano",
  "description": "Hot coffee",
  "price": 2.5,
  "is_available": true,
  "stock": 50,
  "created_at": "...",
  "updated_at": "..."
}
```

### Update product
- Method: `PUT`
- Path: `/v1/products/:id`
- Auth: Bearer (admin only)
- Request JSON: fields optional (same schema as create, but optional)
- Response: `200 OK` wrapper

### Delete product
- Method: `DELETE`
- Path: `/v1/products/:id`
- Auth: Bearer (admin only)
- Response: `200 OK` wrapper

### List products (public)
- Method: `GET`
- Path: `/v1/products`
- Auth: none
- Query params: pagination + `category_id` (optional)
- Response: pagination wrapper with `response.Product` items

### Get product
- Method: `GET`
- Path: `/v1/products/:id`
- Auth: none
- Response: `200 OK` with product object

### Get product stock history
- Method: `GET`
- Path: `/v1/products/:id/stock-histories`
- Auth: Bearer (admin only)
- Query params: pagination
- Response: pagination wrapper of `response.StockHistory` items:

```json
{
  "id": 1,
  "product_id": 10,
  "change": -2,
  "reason": "Order #123 Paid",
  "created_at": "..."
}
```

---

## Orders

Base path: `/v1/orders` — protected endpoints for roles `admin` and `staff`.

### Create order
- Method: `POST`
- Path: `/v1/orders`
- Auth: Bearer (admin|staff)
- Request JSON:

```json
{ "table_id": 12 }
```

- Response: `201 Created` with `data` matching `response.Order` (basic order summary)

### List orders
- Method: `GET`
- Path: `/v1/orders`
- Auth: Bearer (admin|staff)
- Query params: pagination + optional `status` (Open/ Paid/ Cancelled)
- Response: pagination wrapper of `response.Order`

### Get order detail
- Method: `GET`
- Path: `/v1/orders/:id`
- Auth: Bearer (admin|staff)
- Response: `200 OK` `response.OrderDetail` which includes `items` and optional `payment`:

```json
{
  "id": 1,
  "table_id": 12,
  "staff_id": 5,
  "total_amount": 10.0,
  "status": "Open",
  "created_at": "...",
  "updated_at": "...",
  "items": [ /* OrderItem objects */ ],
  "payment": null
}
```

### Update order status
- Method: `PATCH`
- Path: `/v1/orders/:id/status`
- Auth: Bearer (admin|staff)
- Request JSON:

```json
{ "status": "Paid" }
```

- Response: `200 OK` wrapper

### Cancel order
- Method: `DELETE`
- Path: `/v1/orders/:id`
- Auth: Bearer (admin|staff)
- Response: `200 OK` wrapper (the order status is set to `Cancelled` server-side)

---

## Order Items

Operations to add/remove items are under `/v1/orders/:id/items`.

### Add item
- Method: `POST`
- Path: `/v1/orders/:id/items`
- Auth: Bearer (admin|staff)
- Request JSON:

```json
{ "product_id": 42, "quantity": 2 }
```

- Response: `200 OK` with updated `response.OrderDetail` containing the new items and totals

### Remove item
- Method: `DELETE`
- Path: `/v1/orders/:id/items/:item_id`
- Auth: Bearer (admin|staff)
- Response: `200 OK` with updated `response.OrderDetail`

---

## Payments

Base path: `/v1/payments` (protected for `admin|staff`).

### Create payment
- Method: `POST`
- Path: `/v1/payments`
- Auth: Bearer (admin|staff)
- Request JSON:

```json
{
  "order_id": 123,
  "payment_method": "Cash", // Cash | Card | Digital Wallet
  "amount_paid": 100.0
}
```

- Response: `201 Created` with `data` matching `response.Payment`:

```json
{
  "id": 1,
  "order_id": 123,
  "payment_method": "Cash",
  "amount_paid": 100.0,
  "timestamp": "..."
}
```

### Get payment by order
- Method: `GET`
- Path: `/v1/payments/:order_id`
- Auth: Bearer (admin|staff)
- Response: `200 OK` with `response.Payment`

---

## Statistics

Base path: `/v1/statistics` (protected for `admin` only).

### Get dashboard data
- Method: `GET`
- Path: `/v1/statistics/dashboard`
- Auth: Bearer (admin only)
- Response: `200 OK` with `data` matching `response.DashboardResponse`:

```json
{
  "stats": {
    "total_orders": 150,
    "total_revenue": 3500.50
  },
  "sales_chart": [
    { "date": "2024-04-20", "total": 450.0 },
    { "date": "2024-04-21", "total": 600.5 }
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
- Response: `200 OK` with data `{ time: <server time>, ua: <user-agent> }`

### File upload (object storage controller)

There is a controller `UploadFile` that expects a multipart form with a `file` field and enforces a max file size set by configuration. There is no route registered in `internal/routes` for it in the current code scan; if added, the request should be:

- Method: `POST`
- Content-Type: `multipart/form-data`
- Form field name: `file` (single file)
- Response: `200 OK` with `data`:

```json
{ "filename": "<generated>", "path": "uploads/<generated>" }
```

Confirm route presence with the backend owner before using.

---

## Pagination details

Query parameters (form/query):

- `page` (int) — page number (server treats < 1 as 1)
- `page_size` (int) — items per page, default 10
- `order_by` (string) — column to order by, default `updated_at`
- `order_dir` (string) — `desc` or `asc`, default `desc`

List endpoints return a pagination envelope:

```json
{
  "current_page": 1,
  "page_size": 10,
  "total_items": 123,
  "total_pages": 13,
  "has_previous": false,
  "has_next": true,
  "data": [ /* items */ ]
}
```

---

## Error handling & common responses

- Validation errors produce 400 with details in `error`.
- Unauthorized access (missing/invalid/malformed token) produces 401 with a message from authentication errors.
- Forbidden (role not allowed) produces 403.
- Not found produces 404.
- Server/internal issues produce 500; in development mode error details may be exposed in `error`.

Example error response:

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

- Login:

```bash
curl -X POST https://api.example.com/v1/authentications/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"secret"}'
```

- Get public product list:

```bash
curl "https://api.example.com/v1/products?page=1&page_size=10"
```

- Create product (admin):

```bash
curl -X POST https://api.example.com/v1/products \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"category_id":1,"name":"Americano","price":2.5}'
```

- Create order (staff/admin):

```bash
curl -X POST https://api.example.com/v1/orders \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"table_id":12}'
```

- Add order item:

```bash
curl -X POST https://api.example.com/v1/orders/123/items \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"product_id":42,"quantity":2}'
```

- Create payment:

```bash
curl -X POST https://api.example.com/v1/payments \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"order_id":123,"payment_method":"Cash","amount_paid":100.0}'
```

---

## Implementation notes for frontend

- Always validate inputs client-side but rely on server-side validation as canonical.
- Include the `Authorization` header for protected calls.
- Use the refresh token flow when the access token expires — send `refresh_token` to `/v1/authentications/refresh-token` to obtain a new access token.
- For list views use pagination params and render `total_items` / `total_pages` from the server response.
- Respect HTTP status codes: treat non-2xx as error and read the `error` field for details.

---