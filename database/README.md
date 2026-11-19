# To-Do App Database

## Overview
This folder contains the MySQL database schema and sample seed data for the To-Do application.

## Database
- **Database name:** `todo_app`
- **Database engine:** MySQL
- **Storage engine:** InnoDB

## Tables

### 1. users
Stores registered user information and roles.

| Column | Description |
|---|---|
| id | Unique user ID |
| name | User's full name |
| email | Unique email address |
| password_hash | Hashed password |
| role | User role: user or admin |
| created_at | Account creation timestamp |

### 2. categories
Stores task categories created by users.

| Column | Description |
|---|---|
| id | Unique category ID |
| user_id | Owner of the category |
| name | Category name |
| created_at | Category creation timestamp |

### 3. tasks
Stores tasks belonging to users.

| Column | Description |
|---|---|
| id | Unique task ID |
| user_id | Task owner |
| category_id | Optional category ID |
| title | Task title |
| description | Task details |
| status | pending, in_progress, or completed |
| priority | low, medium, or high |
| due_date | Optional task deadline |
| created_at | Task creation timestamp |
| updated_at | Last update timestamp |

## Relationships
- One user can have many tasks.
- One user can have many categories.
- One category can contain many tasks.
- Each task belongs to one user.
- Admin permissions are enforced by the backend.

## Setup

1. Install and start MySQL Server.
2. Open MySQL Workbench or MySQL Command Line.
3. Execute `schema.sql` to create the database and tables.
4. Execute `seed.sql` to insert sample records.

## Files
- `schema.sql` - Database and table creation scripts.
- `seed.sql` - Sample data for testing.
- `README.md` - Database documentation.

## Security
- Passwords must be hashed by the backend before being stored.
- Never commit database passwords or secret credentials.
- Admin permissions must be checked by the backend API.