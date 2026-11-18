# To-Do App — Master Test Cases (Group 11)
**Prepared By:** Karishma Nandan Singh Bora  
**Task ID:** T-002  
**Tech Stack:** Python Flask + Jinja Templates + MySQL  

| Test ID | Feature / Module | Test Scenario | Test Steps | Expected Result | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| TC-01 | Registration | Register with valid details | 1. Open Register page<br>2. Enter valid Name, Email, and Password<br>3. Click Register | Account is created (201) and user redirects to Login/Dashboard | Pending |
| TC-02 | Registration | Register with duplicate email | 1. Open Register page<br>2. Enter an email already saved in database<br>3. Click Register | Error message shown: "Email already exists"; account not created | Pending |
| TC-03 | Registration | Register with blank fields | 1. Leave Name, Email, or Password blank<br>2. Click Register | Validation error shown; form does not submit | Pending |
| TC-04 | Login | Login with valid credentials | 1. Open Login page<br>2. Enter registered Email & correct Password<br>3. Click Login | Login succeeds (200) and user enters their personal Dashboard | Pending |
| TC-05 | Login | Login with wrong password | 1. Open Login page<br>2. Enter valid Email & incorrect Password<br>3. Click Login | Login fails (401) and clear error message is displayed | Pending |
| TC-06 | Logout & Security | Logout and block back-button access | 1. Click Logout button<br>2. Paste Dashboard URL directly in browser | Session ends; user is redirected back to Login page | Pending |
| TC-07 | Add Task | Create a new task with all details | 1. Click Add Task<br>2. Enter Title, Description, Priority (High/Med/Low), Due Date<br>3. Click Save | Task is saved in MySQL (201) and appears in task list | Pending |
| TC-08 | Add Task | Submit task with empty title | 1. Leave Title field blank<br>2. Click Save | Validation error shown; empty task is not created | Pending |
| TC-09 | View Task | Data persistence after page refresh | 1. Add a new task<br>2. Refresh browser or logout & login again | Task remains saved in MySQL and is still visible | Pending |
| TC-10 | Edit Task | Update an existing task | 1. Click Edit on a task<br>2. Modify Title, Priority, or Due Date<br>3. Click Save | Updated details reflect immediately in list and database (200) | Pending |
| TC-11 | Task Status | Mark a Pending task as Completed | 1. Click Complete/Checkbox on a Pending task | Task status changes from `Pending` to `Completed` | Pending |
| TC-12 | Task Status | Reopen a Completed task | 1. Click Reopen on a Completed task | Task status changes back from `Completed` to `Pending` | Pending |
| TC-13 | Delete Task | Delete an existing task | 1. Click Delete on a task<br>2. Confirm deletion | Task is permanently removed from UI and MySQL database (204) | Pending |
| TC-14 | Search | Search task by title keyword | 1. Type a task keyword in the Search bar | Only tasks matching the searched keyword are displayed | Pending |
| TC-15 | Filter | Filter tasks by status | 1. Select status filter (`Pending` / `Completed`) | Only tasks with the selected status are displayed | Pending |
| TC-16 | Sort | Sort tasks by Due Date or Priority | 1. Select Sort option (Due Date / Priority) | Tasks rearrange in the selected order accurately | Pending |
| TC-17 | Privacy | User data isolation | 1. Login as User A<br>2. View Dashboard and try accessing User B's task ID | User A sees only their own tasks; User B's tasks remain private | Pending |
| TC-18 | UI / Responsive | Mobile & Desktop screen check | 1. Open app on desktop screen<br>2. Resize browser to mobile width | Layout adjusts cleanly without overlapping buttons or broken text | Pending |