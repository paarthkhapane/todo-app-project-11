# Screen Designs

## Registration

Create a split auth layout with branding on the larger side and the registration form on the right.

- Fields: full name, email, password, confirm password.
- Public role selection is prohibited; public registration assigns only the normal User role.
- Include show/hide controls for both password fields.
- Show inline required, format, mismatch, and server error states.
- Show a disabled loading button and success redirect/notification when registration succeeds.

## Login

Use the same auth-shell pattern as registration.

- Fields: email and password.
- Optional remember-me control only if the backend supports it.
- Handle empty fields, invalid credentials, loading, network/authentication errors, and focused fields.
- Route to User or Admin dashboard only from the authenticated server response and verified role.

## User Dashboard

- Desktop: persistent 260 px sidebar; mobile: fixed bottom navigation.
- Header: personalized welcome, authenticated name, current date, and profile area.
- Statistics: total, pending, and completed tasks; values come only from the backend.
- Main task view: task card or table with title, description, priority, due date, status, and actions.
- Filters: All, Pending, Completed.
- States: no tasks, no pending tasks, no completed tasks, loading, and API failure.

## Add Task

Use a focused responsive form with title, description, priority, and due date.

- Title and due date constraints follow backend/database conventions.
- Confirm required fields with inline validation.
- Provide Save Task and Cancel actions.
- Show loading and success/error notifications.

## Edit Task

Pre-populate only existing data returned by the API. Allow title, description, priority, due date, and supported status edits. Provide Save Changes and Cancel.

## Delete Task

Use an accessible confirmation modal that identifies the task title and explains that deletion is permanent. Require an explicit Confirm Delete and provide Cancel. Render feedback after success or failure.

## Admin Dashboard

- Completely separate navigation: Overview, Manage Users, All Tasks, Task Statistics, Logout.
- Overview cards: registered users, total tasks, pending tasks, completed tasks.
- Every number is server-derived.

## Manage Users

Use a horizontally responsive table with name, email, role, status, registration date, and approved backend actions. Include search and supported role/status filters. Empty, loading, and API-error states are required.

## All Tasks

Use a responsive table or cards showing task title, owner, description, priority, due date, and status. Include search, pending/completed filters, status badges, loading, and empty/error states.

## Task Statistics

Provide server-backed totals, completion percentage, doughnut/bar charts or progress indicators, and explicit unavailable/loading states. Do not seed demo charts or sample totals.

## Wireframe structure

The visual prototype uses the following shared page structure:

1. Auth screens use a branded left panel and centered form area.
2. Dashboards use a 260 px sidebar, header, statistic cards, and the active content region.
3. Mobile dashboards use a fixed bottom navigation and one-column cards.
4. Task screens use cards for users and tables for administrative task lists.
5. Add/Edit Task uses one reusable modal form.
6. Delete uses a separate warning modal with explicit confirmation.
7. Statistics use summary cards, bar layouts, and completion progress.

The complete navigable wireframe is in [`prototypes/index.html`](./prototypes/index.html).
