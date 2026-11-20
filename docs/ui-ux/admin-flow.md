# Admin Flow

1. An authorized administrator logs in.
2. The verified server role determines access to the separate Admin Dashboard.
3. The Admin Overview shows server-backed user and task statistics.
4. Manage Users provides search and supported filtering, details, and only backend-supported actions.
5. All Tasks shows tasks across registered users with owner and status information.
6. Task Statistics displays server-backed totals, pending/completed counts, and completion percentage.
7. Admin-only navigation is never used as authorization; backend permissions remain mandatory.

The UI must show loading, unavailable, empty, and API-error states rather than invented data.
