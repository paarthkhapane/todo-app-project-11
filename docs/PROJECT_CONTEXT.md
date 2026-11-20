# FlowTask Project Context

## Scope and current repository state

FlowTask (To-Do App Project 11) is intended to be a task-management application with user and admin experiences. This context describes the checkout inspected on 2026-11-20, on branch `feature/frontend`.

The checkout is currently a frontend prototype:

- `backend/` contains only `.gitkeep`.
- `database/` contains only `.gitkeep`.
- `frontend/` contains the Flask preview server, Jinja templates, CSS, and browser JavaScript.
- There is no dependency manifest, migration, schema, API module, authentication module, or automated test suite in this checkout.
- `docs/Test_Cases.md` contains the master test cases, all marked `Pending`.

## Functional requirements

The intended application requirements are:

1. Register a user with name, email, and password.
2. Log in and log out securely.
3. Show a user dashboard with task statistics.
4. Create, view, edit, delete, complete, and reopen tasks.
5. Filter tasks by All, Pending, and Completed.
6. Preserve task data across refreshes and sessions.
7. Keep each user's tasks isolated from other users.
8. Provide admin user and task management.
9. Support responsive desktop and mobile layouts.

These are product requirements, not proof that the corresponding implementations exist.

## Architecture

### Current request flow

`frontend/preview_app.py` creates a Flask application and renders Jinja templates:

- `/` renders `templates/user/dashboard.html`.
- `/login` renders `templates/login.html`.
- `/register` renders `templates/register.html`.

The preview app has no API blueprint, database connection, login middleware, JWT handling, session handling, or authorization checks.

### Template and asset flow

`templates/base.html` provides the HTML shell, viewport metadata, stylesheet links, the content block, the shared `auth.js` script, and an optional `extra_js` block. The dashboard extends the base template and loads `dashboard.js`.

Stylesheets are loaded in this order:

1. `variables.css`
2. `global.css`
3. `components.css`
4. `auth.css`
5. `dashboard.css`
6. `responsive.css`
7. `prototype.css`

The final stylesheet order matters because `prototype.css` contains additional dashboard/sidebar/modal rules.

## Existing implementation status

### Frontend structure

- `frontend/templates/base.html`: shared Jinja layout and asset loading.
- `frontend/templates/register.html`: registration form UI for name, email, password, and confirmation password.
- `frontend/templates/login.html`: currently empty.
- `frontend/templates/user/dashboard.html`: static dashboard layout, sidebar, statistics placeholders, filters, empty task state, and Add Task modal.
- `frontend/static/js/auth.js`: password visibility toggles only.
- `frontend/static/js/dashboard.js`: date display, filter-tab active state, modal open/close behavior, and client-side Add Task title/due-date validation.
- `frontend/static/css/variables.css`: color, typography, spacing, radius, shadow, and layout variables.
- `frontend/static/css/global.css`: base/reset/accessibility styles.
- `frontend/static/css/components.css`: buttons, fields, cards, badges, filters, empty states, charts, and modal base styles.
- `frontend/static/css/auth.css`: authentication page layout and form styles.
- `frontend/static/css/dashboard.css`: dashboard grid, sidebar, header, cards, task, table, and analytics styles.
- `frontend/static/css/responsive.css`: breakpoints at 1100px and 800px, including mobile navigation and stacked layouts.
- `frontend/static/css/prototype.css`: shared prototype helpers plus dashboard and modal additions.

### Registration

The registration template has fields for `name`, `email`, `password`, and `confirm_password`. It has no role selector, so public users cannot choose an admin role through this UI. `auth.js` does not currently submit or validate the form against a backend.

### Login

The login route exists in the preview server, but `templates/login.html` is empty. No login form, API call, token handling, session handling, or redirect is implemented.

### User dashboard

The dashboard displays placeholder user information and `--` statistics. Filter buttons only switch a CSS class and log the selected filter; they do not filter data. The task list is an empty state and has no API loading.

The Add Task modal:

- opens from the dashboard and empty-state buttons;
- closes with Cancel, the close button, clicking the backdrop, or Escape;
- validates non-empty title and due date in the browser;
- displays a client-only message for valid input;
- does not save or submit a task to a backend.

### Admin functionality

No admin templates, routes, controls, role model, permission checks, or admin APIs are present.

## Backend and database

No backend implementation or database schema is available in this repository. Therefore the following cannot be verified:

- Flask API route definitions beyond the preview page routes.
- JWT versus session authentication.
- Password hashing and credential storage.
- MySQL connection settings, tables, foreign keys, indexes, or constraints.
- Task ownership rules.
- User roles and admin permissions.
- API request/response formats or error handling.

The historical endpoint names in the project request are recorded as unverified references only. See [API_CONTRACT.md](./API_CONTRACT.md).

## Authentication and authorization flow

There is currently no authentication or authorization flow. All preview page routes are publicly renderable, and the dashboard route has no guard. The frontend must not be treated as an authority for identity, roles, task ownership, or permissions when backend integration is added.

## UI/UX requirements

The existing design system uses indigo/purple primary colors, white surfaces, muted text, cards, rounded corners, reusable spacing variables, a sidebar, statistics cards, task sections, and responsive layouts. Future work should reuse the existing CSS variables and components rather than introducing a separate visual system.

No external UI/UX reference document or design asset is present in this checkout. The available implementation and the supplied product description are the only verified design references.

## Current development status

The current branch is `feature/frontend`. The latest inspected commit is `e45d9da` (`Checkpoint: frontend dashboard and auth UI`). The repository also contains the master test-case document from the testing branch history; all cases are pending.

The frontend prototype is sufficient to preview the visual dashboard and modal interactions, but it is not an end-to-end application.

## Known incomplete features and dependencies

- Login page UI and authentication: not implemented; blocked by backend authentication contract.
- Registration submission and validation: not implemented; blocked by backend registration contract.
- JWT/session persistence: unknown/not implemented; blocked by backend.
- Task list loading and persistence: not implemented; blocked by task API and database.
- Create task API integration: not implemented; blocked by verified API contract.
- Edit, delete, complete, and reopen actions: not implemented; blocked by task API.
- Real filtering and statistics: not implemented; blocked by task retrieval/data shape.
- Admin dashboard and management: not implemented; blocked by user roles, permissions, API, and database.
- Automated tests: not present; existing manual test cases remain pending.
- Production run/deployment configuration: not present.

## Testing status

The repository has no package manifest, test runner, or frontend test files. The preview server can be syntax-checked and exercised manually in a browser. `docs/Test_Cases.md` is a planned test matrix, not an execution report.

## Important decisions and limitations

- Do not infer JWT, MySQL, endpoint names, or response fields from historical descriptions.
- Do not connect frontend forms until backend routes and payloads are verified from source or an agreed API contract.
- Keep task saving explicitly client-only until persistence exists.
- Keep public registration free of admin role selection.
- Changes should remain scoped to the responsible layer and preserve other team members' work.

