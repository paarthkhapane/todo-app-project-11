# User Flow

1. A visitor opens Registration.
2. The visitor enters name, email, password, and matching confirmation.
3. Public registration creates a normal User account only.
4. On success, the visitor proceeds to Login or a confirmed authenticated route.
5. Login validates server-authenticated credentials.
6. The application displays the User Dashboard and personalized server-backed statistics.
7. The user opens All/My Tasks and can filter by All, Pending, or Completed.
8. The user adds a task with title, description, priority, and due date.
9. The user edits an existing task or marks it completed.
10. Before deletion, the user confirms in a modal naming the task.
11. The user receives success or error feedback and sees the updated task list.

Pending and completed views must contain only tasks owned by the authenticated user.
