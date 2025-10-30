
# Dreamora Express.js E-Commerce Backend

> **Backend Live API on: [https://server-qfd2.onrender.com](https://server-qfd2.onrender.com)**
> 
> **Live on [https://client-delta-brown.vercel.app/](https://client-delta-brown.vercel.app/)**
> 
> **Frontend Repo: [https://github.com/ajaykumarsaini231/T-shirt_E_commers](https://github.com/ajaykumarsaini231/T-shirt_E_commers)**
> 
_Shop smarter, live better – Dreamora brings you the future of online shopping._


<img width="2048" height="2048" alt="image" src="https://github.com/user-attachments/assets/f3eed615-2116-434b-ae02-2654796e9f63" />


---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Available Scripts](#available-scripts)
- [API Endpoints](#api-endpoints)
- [Folder Structure](#folder-structure)
- [Logging & Rate Limiting](#logging--rate-limiting)
- [Contributing](#contributing)
- [License](#license)
- [Screenshots](#screenshots)

---

## Overview

Dreamora server is a robust, modular e-commerce backend built with Express.js.  
It provides secure RESTful APIs for user authentication, product catalog, cart, wishlist, order management, rate limiting, logging, and more.  
This backend is production-ready, scalable, and designed for integration with a modern frontend (e.g., Next.js).

---

## Features

- **Authentication & Security:** Email OTP, JWT, password reset, role-based access.
- **Products & Categories:** CRUD, slugs, search, images, and categorization.
- **Cart & Wishlist:** User-based, live update support.
- **Order Management:** Customers can place/manage orders, admins oversee.
- **Admin Dashboard:** Super admin endpoints with advanced logs.
- **Rate Limiting:** Per-route and global, easily configurable.
- **Centralized Logging:** Unique request IDs, access/error log files.
- **Health & Status:** `/health` and `/rate-limit-info` endpoints.
- **Newsletter & Messaging:** Subscriptions and user queries.
- **Modular Structure:** Scalable for adding new features.

---

## Getting Started

### 1. Clone the Repository

```bash
git clone [https://github.com/your-username/dreamora-server.git](https://github.com/your-username/dreamora-server.git)
cd dreamora-server
````

### 2\. Install Dependencies

```bash
npm install
```

### 3\. Configure `.env`

Copy `.env.example` to `.env` (or create it yourself) and fill in:

```env
NODE_ENV=development
DATABASE_URL="your_connection_string"
NODE_CODE_SENDING_EMAIL_ADDRESS=youremail@example.com
NODE_CODE_SENDING_EMAIL_ADDRESS_PASSWORD=your_email_password
HMAC_VARIFICATION_CODE_SECRET=yourHmacSecret
Secret_Token=yourJWTSecret
NEXTAUTH_URL=frontend url 
FRONTEND_URL=frontend url
```

### 4\. Run The Server

## Available Scripts

5. Install dependencies in the server folder:
    ```
    cd server
    npm install
    ```
6. Run Prisma migration:
    ```
    npx prisma migrate dev
    ```
7. Insert demo data:
    ```
    cd utills
    node insertDemoData.js
    cd ..
    ```
8. Start the backend:
    ```
    node app.js
    ```

## Environment Variables

| Variable                                 | Description                                  |
|------------------------------------------|----------------------------------------------|
| `NODE_ENV`                               | "development" or "production"                |
| `DATABASE_URL`                           | PostgreSQL or SQL connection string          |
| `NODE_CODE_SENDING_EMAIL_ADDRESS`        | Email for OTPs                               |
| `NODE_CODE_SENDING_EMAIL_ADDRESS_PASSWORD`| Email password                               |
| `HMAC_VARIFICATION_CODE_SECRET`          | HMAC secret for OTP                          |
| `Secret_Token`                           | JWT signing secret                           |
| `NEXTAUTH_URL`                           | Frontend URL for CORS/auth                   |
| `FRONTEND_URL`                           | Main frontend URL                            |

-----



-----

## API Endpoints

  - `GET /health` — Health check
  - `GET /rate-limit-info` — Rate limiter info
  - `/api/users` — Users
  - `/api/products` — Products
  - `/api/categories` — Categories
  - `/api/cart` — Carts
  - `/api/orders` — Orders
  - `/api/wishlist` — Wishlists
  - `/api/auth` — Login/OTP/JWT
  - `/api/quary-messages/` — Messaging
  - `/api/news-letter/` — Newsletter
  - `/api/admin` — Admin routes

-----

## Folder Structure

```
.
├── .env
├── app.js
├── controllers/
│   └── ... (controller files)
├── middleware/
│   └── ... (middleware)
├── routes/
│   └── ... (routes)
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── public/
│   ├── assets/
│   └── default-avatar.png
├── scripts/
│   └── ... (utility scripts)
├── tests/
│   └── ... (test scripts)
├── utills/
│   └── ... (utility JS)
├── logs/
│   ├── access.log
│   └── error.log
├── package.json
└── README.md
```

-----

## Logging & Rate Limiting

  - All activity is logged to `/logs/access.log` and `/logs/error.log`
  - Each request is tagged with a unique `requestId`
  - Rate limiting is enforced globally and per-route; see `/rate-limit-info`

-----

## Contributing

Contributions and issues welcome\!  
Fork this repo, create a branch, make your changes, and open a pull request.

-----

## License

MIT

-----

## Screenshots

  - Add API/code screenshots or usage GIFs here (store images in `/public/assets/`).

-----


