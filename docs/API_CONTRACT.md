# FlowTask API Contract

## Contract status

No application API is implemented in the inspected repository. The only Flask routes are page-rendering routes in `frontend/preview_app.py`. There are no backend source files, API blueprints, database models, or route tests from which to derive a JSON API contract.

Do not implement frontend API calls based on the historical endpoint names in project discussions until backend source or an agreed contract is available.

## Verified Flask routes

### `GET /`

- Authentication: **NOT IMPLEMENTED**. The preview route has no guard.
- Request payload: none.
- Behavior: renders `templates/user/dashboard.html`.
- Response format: HTML document, not JSON.
- Validation: none in the route.
- Errors: no application-specific errors are defined.
- Authorization/ownership: none.

### `GET /login`

- Authentication: **NOT IMPLEMENTED**.
- Request payload: none.
- Behavior: renders `templates/login.html`.
- Response format: HTML document. The current template is empty.
- Validation: none in the route.
- Errors: no application-specific errors are defined.
- Authorization/ownership: none.

### `GET /register`

- Authentication: **NOT IMPLEMENTED**.
- Request payload: none.
- Behavior: renders `templates/register.html`.
- Response format: HTML document containing a client-only registration form.
- Validation: none in the route.
- Errors: no application-specific errors are defined.
- Authorization/ownership: none.

## API endpoints

The following application endpoints are **NOT IMPLEMENTED and therefore UNKNOWN**:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/tasks`
- `POST /api/tasks`
- `PUT /api/tasks/<task_id>`
- Any task delete, complete, reopen, statistics, user-management, or admin endpoints.

For these endpoints, the following contract fields are unknown:

- HTTP method and exact URL beyond the historical references above.
- Authentication header, token type, or session mechanism.
- Request payload field names and types.
- Success status codes.
- Response payload shape.
- Validation rules.
- Error status codes and error payloads.
- Task ownership enforcement.
- Admin authorization.

## Frontend fields that require a future contract

The current UI contains these form fields, but they are not API payloads yet:

### Registration form

- `name`
- `email`
- `password`
- `confirm_password`

The form intentionally has no public role field.

### Add Task form

- `title`
- `description`
- `priority` with UI values `low`, `medium`, or `high`
- `due_date`

The current dashboard validates title and due date locally and displays a message that backend saving is not connected. It does not send these fields anywhere.

## Required information before integration

Backend owners must provide or implement a verified contract covering authentication, registration, task CRUD/status operations, statistics, user isolation, admin permissions, validation, and error responses. Frontend integration should begin only after those details are confirmed from backend source or an agreed versioned specification.

