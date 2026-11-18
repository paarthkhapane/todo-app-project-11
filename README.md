# todo-app-project-11

# Backend API

This branch contains the backend API for the To-Do application.

## Implemented

### Task CRUD APIs

Implemented the following Task APIs using Flask and SQLAlchemy:

- `POST /api/tasks` — Create a task
- `GET /api/tasks` — Get tasks
- `GET /api/tasks/<id>` — Get a specific task
- `PUT /api/tasks/<id>` — Update a task
- `DELETE /api/tasks/<id>` — Delete a task

### Authentication

Implemented authentication using JWT:

- `POST /api/auth/register` — Register a new user
- `POST /api/auth/login` — Login and receive a JWT token
- Passwords are hashed before being stored.
- JWT tokens contain the user's ID and role.
- Protected task APIs require a valid JWT token.

### Task Ownership

- The `user_id` is taken from the authenticated user's JWT.
- Users can only access their own tasks.
- Accessing another user's task returns `403 Forbidden`.
- Missing or invalid authentication returns `401 Unauthorized`.

## Backend Structure

```text
backend/
├── app.py       # Flask application and API routes
├── auth.py      # Password hashing and JWT authentication
└── models.py    # User and Task database models
```

## Configuration

Database configuration is kept in the root `.env` file and is not committed to Git.

`.env.example` is provided as a template.

## Current Status

The backend code and authentication implementation are complete.

Database integration still needs to be completed with the database provided by the database team member.

Once the database is available:

1. Add the database details to the local `.env`.
2. Make sure the required `users` and `tasks` tables are available.
3. Start the Flask server.
4. Test registration and login.
5. Test the protected Task APIs.
6. Verify task ownership and authentication responses.

After these tests pass, the branch can be pushed and the Pull Request can be created.