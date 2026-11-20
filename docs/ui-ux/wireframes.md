# Wireframes

These text wireframes describe the visual structure used by the standalone prototype.

## Login

```text
+----------------------------------------------------------+
| Brand Panel                 | Login Card                 |
| Logo                        | Welcome back               |
| FlowTask                    | Email                      |
| "Plan clearly..."           | Password          [Show]   |
|                             | [ ] Remember me            |
|                             | [        Log In        ]   |
|                             | Create an account          |
+----------------------------------------------------------+
```

## Registration

```text
+----------------------------------------------------------+
| Brand Panel                 | Create Account Card        |
| Logo                        | Full Name                  |
| FlowTask                    | Email                      |
|                             | Password          [Show]   |
|                             | Confirm Password  [Show]   |
|                             | [    Create Account   ]    |
|                             | Already have an account?   |
+----------------------------------------------------------+
```

Public registration shows no admin role or privilege selector.

## User Dashboard

```text
+----------+-----------------------------------------------+
| Logo     | Welcome back, Om       Profile                |
| Overview |-----------------------------------------------|
| My Tasks | [Total] [Pending] [Completed]                 |
| Add Task |---------------- My Tasks --------------------|
| Pending  | [All] [Pending] [Completed]                   |
| Completed| [ Task card ] [ Task card ] [ Task card ]     |
| Logout   |                                               |
+----------+-----------------------------------------------+
```

## Add/Edit Task

```text
+---------------------- Modal -------------------------+
| Add Task / Edit Task                         [Close] |
| Task Title                                           |
| Description                                          |
| Priority             | Due Date                      |
| [Cancel]                            [Save]            |
+------------------------------------------------------+
```

## Delete Confirmation

```text
+------------------- Confirmation ---------------------+
| Delete Task                                         |
| The selected illustrative task will be deleted.      |
| [Cancel]                            [Confirm Delete] |
+------------------------------------------------------+
```

## Task List

```text
+----------+-----------------------------------------------+
| Sidebar  | My Tasks                                      |
|          | [All] [Pending] [Completed]                   |
|          | [Status] [Priority]                           |
|          | Task title and description                    |
|          | Due date                                      |
|          | [Complete] [Edit] [Delete]                    |
+----------+-----------------------------------------------+
```

## Admin Dashboard

```text
+----------+-----------------------------------------------+
| Logo     | Admin Overview          Profile               |
| Overview |-----------------------------------------------|
| Users    | [Users] [Tasks] [Pending] [Completed]         |
| All Tasks| Admin task table                              |
| Stats    |                                               |
| Logout   |                                               |
+----------+-----------------------------------------------+
```

## Manage Users

```text
+----------+-----------------------------------------------+
| Admin    | Manage Users                                  |
| sidebar  | [Search users]  [All Roles]                    |
|          | Name | Email | Role | Status | Date | Action   |
+----------+-----------------------------------------------+
```

## All Tasks

```text
+----------+-----------------------------------------------+
| Admin    | All Tasks                                     |
| sidebar  | [Search] [All] [Pending] [Completed]          |
|          | Task | Owner | Priority | Due | Status        |
+----------+-----------------------------------------------+
```

## Task Statistics

```text
+----------+-----------------------------------------------+
| Admin    | Task Statistics                               |
| sidebar  | [Total] [Pending] [Completed] [Percentage]    |
|          | [Bar chart]        [Completion progress]      |
+----------+-----------------------------------------------+
```

## Mobile behavior

- Auth panels stack vertically.
- Dashboard sidebar becomes fixed bottom navigation.
- Statistics and task cards use one column.
- Modals and forms use full-width actions.
- Administrative tables remain horizontally scrollable.
