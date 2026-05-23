# DevPulse - Internal Tech Issue & Feature Tracker

DevPulse is a backend API for managing internal technical issues and feature requests within a development team.  
It provides authentication, issue tracking, role-based authorization, filtering, and issue management capabilities.

> Live URL: https://devpulse-theta-ten.vercel.app/

---

# Features

- User authentication with JWT
- Secure login and signup system
- Role-based authorization
- Create, update, retrieve, and delete issues
- Maintainer-only issue deletion
- Contributor-specific update permissions
- Dynamic issue filtering and sorting
- PostgreSQL database integration
- Structured REST API architecture
- TypeScript support for better type safety

---

# Tech Stack

- Node.js
- Express.js
- TypeScript
- PostgreSQL
- JWT (JSON Web Token)
- pg (node-postgres)

---

# Project Structure

```bash
src/
├── app/
│   ├── modules/
│   │   ├── auth/
│   │   ├── issues/
│   │   └── middleware/
│   └── config/
├── db/
├── server.ts
└── app.ts
```

---

# Installation & Setup

## 1. Clone the repository

```bash
git clone <your-github-repository-url>
cd DevPulse-Internal-Tech-Issue-Tracker
```

---

## 2. Install dependencies

```bash
npm install
```

---

## 3. Create `.env` file

Create a `.env` file in the root directory and add:

```env
PORT=5000

CONNECTION_STRING=your_postgresql_connection_string

JWT_ACCESS_TOKEN=your_access_secret
JWT_REFRESH_TOKEN=your_refresh_secret
```

---

## 4. Run the development server

```bash
npm run dev
```

Server will start at:

```bash
http://localhost:5000
```

---

# API Endpoint List

## Authentication

### Signup User

```http
POST /api/auth/signup
```

### Login User

```http
POST /api/auth/login
```

---

## Issues

### Create Issue

```http
POST /api/issues
```

Requires JWT access token.

---

### Get All Issues

```http
GET /api/issues
```

### Get Issues Sorted by Newest

```http
GET /api/issues?sort=newest
```

### Get Issues Sorted by Oldest

```http
GET /api/issues?sort=oldest
```

### Filter by Type

```http
GET /api/issues?type=bug
```

### Filter by Status

```http
GET /api/issues?status=open
```

---

### Get Single Issue

```http
GET /api/issues/:id
```

---

### Update Single Issue

```http
PATCH /api/issues/:id
```

Authorization Rules:

- Maintainer can update any issue
- Contributor can update own issue only if issue status is `open`

Requires JWT access token.

---

### Delete Single Issue

```http
DELETE /api/issues/:id
```

Authorization Rules:

- Only Maintainer can delete issues

Requires JWT access token.

---

# Database Schema Summary

## Users Table

| Column     | Type      | Description              |
| ---------- | --------- | ------------------------ |
| id         | SERIAL    | Primary key              |
| name       | VARCHAR   | User name                |
| email      | VARCHAR   | Unique user email        |
| password   | TEXT      | Hashed password          |
| role       | VARCHAR   | contributor / maintainer |
| created_at | TIMESTAMP | Record creation time     |
| updated_at | TIMESTAMP | Record update time       |

---

## Issues Table

| Column      | Type      | Description                   |
| ----------- | --------- | ----------------------------- |
| id          | SERIAL    | Primary key                   |
| reporter_id | INTEGER   | References users(id)          |
| title       | VARCHAR   | Issue title                   |
| description | TEXT      | Detailed issue description    |
| type        | VARCHAR   | bug / feature_request         |
| status      | VARCHAR   | open / in_progress / resolved |
| created_at  | TIMESTAMP | Record creation time          |
| updated_at  | TIMESTAMP | Record update time            |

---

# Authorization Rules

## Contributor

- Can create issues
- Can update own issues only when status is `open`

## Maintainer

- Can update any issue
- Can delete any issue

---

# Example Authorization Header

```http
Authorization: Bearer YOUR_ACCESS_TOKEN
```

---

# Future Improvements

- Refresh token authentication
- Pagination
- Search functionality
- Request validation
- Docker support
- API documentation with Swagger
- Unit and integration testing

---

# Author

Developed by Shafkat Ahmed
