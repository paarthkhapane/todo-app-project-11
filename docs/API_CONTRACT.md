# FlowTask API Contract

Verified application API contract implemented in `backend/app.py` and guarded via `backend/auth.py`.

## Authentication Header
All protected endpoints require the JWT token passed in the `Authorization` header:
```
Authorization: Bearer <token>
```

---

## 1. Page Routes

| Route | Method | Access | Template | Description |
|---|---|---|---|---|
| `/` | GET | Public Shell / Client Guard | `frontend/templates/user/dashboard.html` | User task management workspace |
| `/login` | GET | Public | `frontend/templates/login.html` | Authentication login page |
| `/register` | GET | Public | `frontend/templates/register.html` | Authentication registration page |
| `/admin` | GET | Admin / Client Guard | `frontend/templates/admin/dashboard.html` | Administrator management console |

---

## 2. Public Authentication Endpoints

### `POST /api/auth/register`
- **Access**: Public
- **Request Payload**:
  ```json
  {
    "name": "Jane Doe",
    "email": "jane@example.com",
    "password": "SecurePassword123!"
  }
  ```
- **Responses**:
  - `201 Created`: `{"message": "User registered successfully", "user": {"id": 1, "name": "Jane Doe", "email": "jane@example.com", "role": "user", "created_at": "..."}}`
  - `400 Bad Request`: `{"error": "<validation error message>"}`
  - `409 Conflict`: `{"error": "Email is already registered"}`

### `POST /api/auth/login`
- **Access**: Public
- **Request Payload**:
  ```json
  {
    "email": "jane@example.com",
    "password": "SecurePassword123!"
  }
  ```
- **Responses**:
  - `200 OK`: `{"token": "<jwt_string>", "user": {"id": 1, "name": "Jane Doe", "email": "jane@example.com", "role": "user", "created_at": "..."}}`
  - `401 Unauthorized`: `{"error": "Invalid email or password"}`

---

## 3. Protected User Task Endpoints

### `GET /api/tasks`
- **Access**: Authenticated User (`@token_required`)
- **Responses**:
  - `200 OK`: Array of task objects belonging to the authenticated user.
  - `401 Unauthorized`: `{"error": "Authorization header is missing" | "Invalid token"}`

### `POST /api/tasks`
- **Access**: Authenticated User (`@token_required`)
- **Request Payload**:
  ```json
  {
    "title": "Prepare Sprint Demo",
    "description": "Slide deck and setup",
    "priority": "high",
    "due_date": "2026-11-25T14:00:00",
    "category": "Work"
  }
  ```
- **Responses**:
  - `201 Created`: Created task object with `category_id` and `category` resolved.
  - `400 Bad Request`: `{"error": "'title' is required and cannot be empty"}`

### `GET /api/tasks/<int:task_id>`
- **Access**: Authenticated Owner (`@token_required`)
- **Responses**:
  - `200 OK`: Task object
  - `403 Forbidden`: `{"error": "You do not have permission to access this task"}`
  - `404 Not Found`: `{"error": "Task not found"}`

### `PUT /api/tasks/<int:task_id>`
- **Access**: Authenticated Owner (`@token_required`)
- **Request Payload**: Partial task fields (`title`, `description`, `status`, `priority`, `due_date`, `category`)
- **Responses**:
  - `200 OK`: Updated task object
  - `403 Forbidden`: `{"error": "You do not have permission to modify this task"}`

### `DELETE /api/tasks/<int:task_id>`
- **Access**: Authenticated Owner (`@token_required`)
- **Responses**:
  - `200 OK`: `{"message": "Task deleted successfully"}`
  - `403 Forbidden`: `{"error": "You do not have permission to delete this task"}`

---

## 4. Protected Administrator Endpoints

All admin endpoints require valid JWT credentials with `role == 'admin'` (`@token_required` and `@admin_required`). Regular users receive `403 Forbidden`.

### `GET /api/admin/stats`
- **Access**: Admin Only
- **Responses**:
  - `200 OK`:
    ```json
    {
      "total_users": 10,
      "admin_count": 1,
      "regular_user_count": 9,
      "total_tasks": 25,
      "pending_tasks": 12,
      "in_progress_tasks": 5,
      "completed_tasks": 8,
      "completion_rate": 32.0,
      "priority_breakdown": {
        "low": 6,
        "medium": 11,
        "high": 8
      },
      "total_categories": 7,
      "recent_users": [...]
    }
    ```

### `GET /api/admin/users`
- **Access**: Admin Only
- **Query Parameters**: `q` (search string), `role` (`all`, `user`, `admin`)
- **Responses**:
  - `200 OK`: Array of user objects including `task_count`, `completed_task_count`, and `is_current_admin`.

### `DELETE /api/admin/users/<int:user_id>`
- **Access**: Admin Only
- **Safeguard**: Returns `400 Bad Request` if an administrator attempts to delete their own account.
- **Responses**:
  - `200 OK`: `{"message": "User '<email>' and all associated tasks/categories were deleted successfully."}`
  - `400 Bad Request`: `{"error": "Security safeguard: Administrators cannot delete their own account."}`
  - `404 Not Found`: `{"error": "User not found"}`

### `GET /api/admin/tasks`
- **Access**: Admin Only
- **Query Parameters**: `q` (title/desc search), `status` (`pending`, `in_progress`, `completed`), `priority` (`low`, `medium`, `high`), `user_id`
- **Responses**:
  - `200 OK`: Array of task objects with embedded `user_name` and `user_email`.

### `PUT /api/admin/tasks/<int:task_id>`
- **Access**: Admin Only
- **Request Payload**: Fields to moderate (`title`, `description`, `status`, `priority`, `due_date`)
- **Responses**:
  - `200 OK`: Updated task object with user metadata.
  - `404 Not Found`: `{"error": "Task not found"}`

### `DELETE /api/admin/tasks/<int:task_id>`
- **Access**: Admin Only
- **Responses**:
  - `200 OK`: `{"message": "Task '<title>' was deleted successfully by administrator."}`
  - `404 Not Found`: `{"error": "Task not found"}`

---

## 5. Admin Provisioning Utility
Administrators cannot be registered through public registration. Administrators must be provisioned via the secure local CLI utility:
```bash
python backend/create_admin.py --email admin@example.com --password <strong_password> --name "System Administrator"
python backend/create_admin.py --promote --email existing_user@example.com
```


