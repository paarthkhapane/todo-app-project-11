# Backend Verification Guide

## Purpose

This guide is for testing the Flask backend against the MySQL database used by the database team.

The project uses the `main` branch for integrated development.
All backend, frontend, and database integration changes are merged into this branch.

---

## 1. Get the Latest Code

From the project root:

```bash
git checkout main
git pull origin main
```

Make sure the latest changes are present.

---

## 2. Verify MySQL

Make sure MySQL is running locally.

The backend expects:

| Configuration | Value       |
| ------------- | ----------- |
| Host          | `localhost` |
| Port          | `3306`      |
| Database      | `todo_app`  |

The database should already contain these tables:

- `users`
- `categories`
- `tasks`

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

```http
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

```http
POST /api/auth/register
```

Full URL:

```text
http://127.0.0.1:5000/api/auth/register
```

### JSON Body

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

### Database Check

Open MySQL and verify that a new row was added to the `users` table.

The `password_hash` column should contain a hashed password, not the original password:

```text
TestPassword123
```

---

## 8. Login

### Request

```http
POST /api/auth/login
```

### JSON Body

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

For the following protected requests, add the Authorization header:

```http
Authorization: Bearer YOUR_JWT_TOKEN
```

---

## 9. Create a Task

### Request

```http
POST /api/tasks
```

### JSON Body

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

- `id`
- `user_id`
- `category_id`
- `title`
- `description`
- `status`
- `priority`
- `due_date`
- `created_at`
- `updated_at`

`category_id` should be `null` if no category was supplied.

---

## 10. Verify Task in MySQL

Check the `tasks` table.

The created task should exist, and its `user_id` should match the authenticated user.

---

## 11. Get Tasks

### Request

```http
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

```http
GET /api/tasks/<task_id>
```

Example:

```http
GET /api/tasks/1
```

### Expected

```text
200 OK
```

---

## 13. Update a Task

### Request

```http
PUT /api/tasks/<task_id>
```

Example:

```http
PUT /api/tasks/1
```

### JSON Body

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

```http
DELETE /api/tasks/<task_id>
```

### Expected

```text
200 OK
```

Verify that the task is removed from the `tasks` table.

---

# Category Testing

The database schema contains a `categories` table.

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

```http
POST /api/tasks
```

### JSON Body

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

The response should contain the selected `category_id`.

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

Where category `2` belongs to another user.

### Expected

```text
403 Forbidden
```

This confirms that one user cannot attach another user's category to their task.

---

# Validation Testing

The database allows only these task statuses:

- `pending`
- `in_progress`
- `completed`

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

- `low`
- `medium`
- `high`

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

```http
GET /api/tasks
```

Without the `Authorization` header.

### Expected

```text
401 Unauthorized
```

---

## 22. Test User Ownership

Create two test users.

For example:

- `user1@example.com`
- `user2@example.com`

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

# Admin Role Management

FlowTask assigns the default `user` role to newly registered accounts. To grant administrator privileges to a teammate, an authorized developer or administrator can manually update the user's role in the MySQL database.

Admin privileges should not be available as a self-selected role during public registration.

## 23. Register a Teammate

Ask the teammate to:

1. Open the FlowTask registration page.
2. Register using their name, email, and password.
3. Log in once to make sure their account is created successfully.

New accounts should have the default role of `user`.

---

## 24. Connect to MySQL

Open the MySQL command-line terminal:

```powershell
mysql -u root -p
```

Enter your MySQL password when prompted.

---

## 25. Select the Application Database

```sql
USE todo_app;
```

---

## 26. Verify the User Account

Check the registered users:

```sql
SELECT id, name, email, role
FROM users;
```

Find the teammate's account using their registered email address.

Confirm that their current role is `user` before proceeding.

---

## 27. Promote the User to Admin

Replace the email address below with the exact registered email of the teammate you want to promote.

```sql
UPDATE users
SET role = 'admin'
WHERE email = 'teammate@example.com';
```

This updates the role of the specified account to `admin`.

Make sure the email address matches the intended account.

---

## 28. Verify the Admin Role

Run:

```sql
SELECT name, email, role
FROM users
WHERE email = 'teammate@example.com';
```

### Expected Result

| Name          | Email                | Role  |
| ------------- | -------------------- | ----- |
| Teammate Name | teammate@example.com | admin |

If the query returns `admin` in the role column, the promotion was successful.

---

## 29. Log In and Test Admin Access

Ask the promoted teammate to:

1. Log out of FlowTask.
2. Log back in.
3. Open the Admin Dashboard.
4. Verify that admin functions are available.

Re-login is important if the application stores the user's role inside the JWT token at login time.

---

## 30. Admin Security Verification

Verify the following:

- A normal user cannot access admin-only pages.
- A normal user cannot perform admin-only API requests.
- An admin can access authorized admin functionality.
- Admin role assignment is not available during public registration.
- Admin privileges are enforced by the backend, not only by hiding frontend buttons.

---

# Database Integration Checklist

| Test                         | Expected |
| ---------------------------- | -------- |
| MySQL running                | PASS     |
| `todo_app` exists            | PASS     |
| `users` table exists         | PASS     |
| `categories` table exists    | PASS     |
| `tasks` table exists         | PASS     |
| Flask starts                 | PASS     |
| Health check                 | PASS     |
| User registration            | PASS     |
| User stored in MySQL         | PASS     |
| Password hashed              | PASS     |
| Login                        | PASS     |
| JWT generated                | PASS     |
| Create task                  | PASS     |
| Task stored in MySQL         | PASS     |
| Get tasks                    | PASS     |
| Update task                  | PASS     |
| `updated_at` changes         | PASS     |
| Delete task                  | PASS     |
| Category assignment          | PASS     |
| Category ownership           | PASS     |
| Invalid status rejected      | PASS     |
| Invalid priority rejected    | PASS     |
| Missing JWT rejected         | PASS     |
| Task ownership enforced      | PASS     |
| Admin role promotion         | PASS     |
| Admin login                  | PASS     |
| Admin dashboard access       | PASS     |
| Admin authorization enforced | PASS     |

---

# If Something Fails

Record the following information:

1. API endpoint
2. HTTP status code
3. Response/error message
4. Flask terminal error, if any
5. MySQL error, if any

Example:

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

This information helps identify whether the problem is in:

- Flask/backend code
- SQLAlchemy model
- MySQL connection
- Database schema
- `.env` configuration
- Authentication/JWT
- Task validation
- Category ownership
- Admin authorization

---

# Security Notes

- Never commit `.env` files or credentials to GitHub.
- Passwords must be stored as hashes, never plaintext.
- Do not allow users to assign themselves an `admin` role during registration.
- Admin role changes should be performed only by authorized personnel.
- Protected API endpoints must verify the JWT and authorization permissions on the backend.
- Hiding admin options in the frontend alone is not sufficient security.
- Use a dedicated database account with appropriate permissions in production.
