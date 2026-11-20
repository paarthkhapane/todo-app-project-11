# FlowTask Development Status

Status is based on the repository inspected on 2026-11-20, branch `feature/frontend`. A product requirement is not marked complete unless implementation is present in this checkout.

## Completed

- Frontend project structure with Jinja templates and static CSS/JavaScript.
- Shared base template and existing indigo/purple design system.
- Registration page visual form with name, email, password, and confirmation fields.
- Public registration UI does not expose an admin role selector.
- User dashboard visual shell with sidebar, header, profile placeholder, statistics cards, filters, and empty task state.
- Add Task modal UI.
- Client-side Add Task modal open/close interactions.
- Client-side required title and due-date validation.
- Responsive layouts and mobile sidebar spacing fixes in the current frontend checkpoint.
- Flask preview routes for `/`, `/login`, and `/register`.

## In progress

- Frontend prototype integration with the future Flask API.
- Authentication page implementation and backend wiring.
- Task dashboard data rendering.
- Product test execution.

These are development areas represented by the current UI or project requirements; no backend implementation is present yet.

## Not implemented

- Login form UI and login submission.
- Registration submission, account creation, and duplicate-email handling.
- Logout and protected-route behavior.
- JWT or session authentication.
- Backend API routes.
- MySQL schema, migrations, models, or connections.
- Loading tasks from a server.
- Saving tasks to a server.
- Editing tasks.
- Deleting tasks.
- Completing or reopening tasks.
- Real task filtering.
- Real task statistics.
- Search and sorting.
- Admin dashboard.
- Admin user management.
- Admin task management.
- Automated frontend/backend tests.

## Blocked by backend

- Registration and login integration.
- Authentication state and protected dashboard access.
- Logout behavior.
- Task CRUD and status operations.
- Server-side task filtering, search, sorting, and statistics.
- User/task ownership enforcement.
- Admin role and permission enforcement.

The exact routes, authentication mechanism, payloads, response shapes, and error codes are not available in this checkout.

## Blocked by database

- User persistence.
- Password and role persistence.
- Task persistence.
- Task-to-user relationships and ownership constraints.
- Duplicate-email constraints.
- Task status, priority, and due-date constraints.
- Admin/user/task data needed for management views.

No database schema or migration files are present.

## Needs testing

All cases in [Test_Cases.md](./Test_Cases.md) are marked `Pending`, including:

- Registration and login scenarios.
- Logout and protected access.
- Add, view, edit, complete, reopen, and delete task scenarios.
- Persistence after refresh.
- Search, filtering, and sorting.
- User data isolation.
- Desktop/mobile responsive behavior.

The current frontend interaction layer should receive focused browser tests for registration/login UI once those pages are implemented, dashboard rendering once API data exists, and the Add Task modal behavior already present.

## Risks and dependencies

- The project request references JWT and MySQL, but neither is verified in source.
- The empty login template means the preview cannot demonstrate authentication.
- The preview dashboard is publicly reachable and must not be treated as a protected production route.
- Frontend API work depends on a stable backend contract.
- Admin work depends on verified roles, authorization rules, and database relationships.
- No dependency or build manifest is available, so reproducible automated validation is not yet configured.

