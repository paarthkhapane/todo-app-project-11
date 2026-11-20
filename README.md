# Backend Verification Guide

## Purpose

This guide is for testing the Flask backend against the MySQL database used by the database team.

The backend branch is:

`feature/backend-api`

The database expected by the backend is:

`todo_app`

This guide only verifies the existing backend and database integration. It does not create or modify database tables.

---

## 1. Get the Latest Backend Code

From the project root:

```bash
git fetch origin
git checkout feature/backend-api
git pull origin feature/backend-api
```

Make sure the latest backend changes are present.

---

## 2. Verify MySQL

Make sure MySQL is running locally.

The backend expects:

```text
Host: localhost
Port: 3306
Database: todo_app
```

The database should already contain these tables:

```text
users
categories
tasks
```

The database schema should be created using the database team's SQL files.

The Flask backend does **not** create the database or tables automatically.

---

## 3. Configure `.env`

Create or update the `.env` file in the project root.

Example:

```env
DB_HOST=localhost
DB_PORT=3306
DB_NAME=todo_app
DB_USER=root
DB_PASSWORD=YOUR_MYSQL_PASSWORD

JWT_SECRET_KEY=YOUR_JWT_SECRET
```

Use your own local MySQL username/password.

Do not commit `.env`.

---

## 4. Create/Activate Python Environment

From the project root:

```powershell
python -m venv .venv
```

If `.venv` already exists, do not recreate it.

Activate it:

```powershell
.venv\Scripts\Activate.ps1
```

Install dependencies:

```powershell
pip install -r requirements.txt
```

---

## 5. Start the Backend

From the project root:

```powershell
python backend/app.py
```

Expected output should contain something similar to:

```text
Running on http://127.0.0.1:5000
```

Keep this terminal running.

---

# API Testing

Use Thunder Client, Postman, or another API testing tool.

Base URL:

```text
http://127.0.0.1:5000
```

---

## 6. Health Check

### Request

```text
GET /
```

### Expected

```text
200 OK
```

The response should indicate that the backend is running.

---

# Authentication Testing

## 7. Register a Test User

### Request

```text
POST /api/auth/register
```

Full URL:

```text
http://127.0.0.1:5000/api/auth/register
```

### JSON body

```json
{
    "name": "Backend Test User",
    "email": "backend.test@example.com",
    "password": "TestPassword123"
}
```

### Expected

```text
201 Created
```

The response should contain the newly created user.

The password must not be returned.

### Database check

Open MySQL and verify that a new row was added to:

```text
users
```

The `password_hash` column should contain a hashed password, not:

```text
TestPassword123
```

---

## 8. Login

### Request

```text
POST /api/auth/login
```

### JSON body

```json
{
    "email": "backend.test@example.com",
    "password": "TestPassword123"
}
```

### Expected

```text
200 OK
```

The response should contain a JWT token.

Copy the token for the protected task requests.

---

# Task API Testing

For the following protected requests, add:

```text
Authorization: Bearer YOUR_JWT_TOKEN
```

---

## 9. Create a Task

### Request

```text
POST /api/tasks
```

### JSON body

```json
{
    "title": "Backend integration test",
    "description": "Testing Flask with the todo_app database",
    "status": "pending",
    "priority": "high"
}
```

Do not send `user_id`.

The backend gets the user ID from the JWT.

### Expected

```text
201 Created
```

The response should contain:

```text
id
user_id
category_id
title
description
status
priority
due_date
created_at
updated_at
```

`category_id` should be `null` if no category was supplied.

---

## 10. Verify Task in MySQL

Check the `tasks` table.

The created task should exist and its:

```text
user_id
```

should match the authenticated user.

---

## 11. Get Tasks

### Request

```text
GET /api/tasks
```

### Expected

```text
200 OK
```

The authenticated user should receive their own tasks.

---

## 12. Get One Task

Use the task ID returned from task creation.

### Request

```text
GET /api/tasks/<task_id>
```

Example:

```text
GET /api/tasks/1
```

### Expected

```text
200 OK
```

---

## 13. Update a Task

### Request

```text
PUT /api/tasks/<task_id>
```

Example:

```text
PUT /api/tasks/1
```

### JSON body

```json
{
    "title": "Updated backend integration test",
    "status": "in_progress",
    "priority": "medium"
}
```

### Expected

```text
200 OK
```

The response should show the updated values.

`updated_at` should also be updated.

---

## 14. Test Completed Status

Update the same task:

```json
{
    "status": "completed"
}
```

Expected:

```text
200 OK
```

---

## 15. Delete a Task

### Request

```text
DELETE /api/tasks/<task_id>
```

### Expected

```text
200 OK
```

Verify that the task is removed from the `tasks` table.

---

# Category Testing

The database schema contains:

```text
categories
```

Categories belong to users.

---

## 16. Check Existing Categories

Open MySQL and check:

```sql
SELECT * FROM categories;
```

Identify a category belonging to the test user.

---

## 17. Create a Task with a Category

Use the category ID belonging to the authenticated test user.

### Request

```text
POST /api/tasks
```

### JSON body

```json
{
    "title": "Categorized task test",
    "description": "Testing category assignment",
    "status": "pending",
    "priority": "medium",
    "category_id": 1
}
```

Replace `1` with the actual category ID belonging to the test user.

### Expected

```text
201 Created
```

The response should contain the selected:

```text
category_id
```

---

## 18. Test Category Ownership

Try assigning a category that belongs to another user.

For example:

```json
{
    "title": "Invalid category test",
    "category_id": 2
}
```

where category `2` belongs to another user.

### Expected

```text
403 Forbidden
```

This confirms that one user cannot attach another user's category to their task.

---

# Validation Testing

The database allows only these task statuses:

```text
pending
in_progress
completed
```

---

## 19. Invalid Status

Try:

```json
{
    "title": "Invalid status test",
    "status": "done"
}
```

### Expected

```text
400 Bad Request
```

---

## 20. Invalid Priority

Allowed priorities are:

```text
low
medium
high
```

Try:

```json
{
    "title": "Invalid priority test",
    "priority": "urgent"
}
```

### Expected

```text
400 Bad Request
```

---

# Authentication & Ownership Testing

## 21. Request Without JWT

Try:

```text
GET /api/tasks
```

without the `Authorization` header.

### Expected

```text
401 Unauthorized
```

---

## 22. Test User Ownership

Create two test users.

For example:

```text
user1@example.com
user2@example.com
```

Login as User 1 and create a task.

Then login as User 2 and attempt to access User 1's task.

### Expected

The second user must not be allowed to access, update, or delete the first user's task.

Expected response:

```text
403 Forbidden
```

for protected ownership operations.

This verifies that task ownership is being enforced by the backend.

---

# Database Integration Checklist

After completing the tests, verify:

| Test | Expected |
|---|---|
| MySQL running | PASS |
| `todo_app` exists | PASS |
| `users` table exists | PASS |
| `categories` table exists | PASS |
| `tasks` table exists | PASS |
| Flask starts | PASS |
| Health check | PASS |
| User registration | PASS |
| User stored in MySQL | PASS |
| Password hashed | PASS |
| Login | PASS |
| JWT generated | PASS |
| Create task | PASS |
| Task stored in MySQL | PASS |
| Get tasks | PASS |
| Update task | PASS |
| `updated_at` changes | PASS |
| Delete task | PASS |
| Category assignment | PASS |
| Category ownership | PASS |
| Invalid status rejected | PASS |
| Invalid priority rejected | PASS |
| Missing JWT rejected | PASS |
| Task ownership enforced | PASS |

---

## If Something Fails

Record:

1. API endpoint
2. HTTP status code
3. Response/error message
4. Flask terminal error, if any
5. MySQL error, if any

For example:

```text
Endpoint:
POST /api/tasks

Status:
500

Response:
Database error...

Flask error:
...

MySQL:
...
```

This information is enough to identify whether the problem is in:

- Flask/backend code
- SQLAlchemy model
- MySQL connection
- database schema
- `.env` configuration
- authentication/JWT
- test request