# To-Do App — Master Test Cases & Bug Report (Group 11)
**Prepared By:** Karishma Nandan Singh Bora  
**Task ID:** T-002  
**Tech Stack:** Python Flask + Jinja Templates + MySQL  

## 1. Test Execution Summary
- **Total Test Cases:** 18
- **Passed:** 16
- **Failed / Not Implemented:** 2 (TC-14, TC-16)
- **Additional Bugs Identified:** 3 (BUG-01 to BUG-03)

---

## 2. Master Test Cases Table

| Test ID | Feature / Module | Test Scenario | Test Steps | Expected Result | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| TC-01 | Registration | Register with valid details | 1. Open Register page<br>2. Enter valid Name, Email, and Password<br>3. Click Register | Account is created (201) and user redirects to Login/Dashboard | **Pass** |
| TC-02 | Registration | Register with duplicate email | 1. Open Register page<br>2. Enter an email already saved in database<br>3. Click Register | Error message shown: "Email is already registered"; account not created | **Pass** |
| TC-03 | Registration | Register with blank fields | 1. Leave Name, Email, or Password blank<br>2. Click Register | Validation error shown; form does not submit | **Pass** |
| TC-04 | Login | Login with valid credentials | 1. Open Login page<br>2. Enter registered Email & correct Password<br>3. Click Login | Login succeeds (200) and user enters their personal Dashboard | **Pass** |
| TC-05 | Login | Login with wrong password | 1. Open Login page<br>2. Enter valid Email & incorrect Password<br>3. Click Login | Login fails (401) and clear error message is displayed *(Note: Error displays twice — see BUG-03)* | **Pass** |
| TC-06 | Logout & Security | Logout and block back-button access | 1. Click Logout button<br>2. Paste Dashboard URL directly in browser | Session ends; user is redirected back to Login page | **Pass** |
| TC-07 | Add Task | Create a new task with all details | 1. Click Add Task<br>2. Enter Title, Description, Priority (High/Med/Low), Due Date<br>3. Click Save | Task is saved in MySQL (201) and appears in task list | **Pass** |
| TC-08 | Add Task | Submit task with empty title | 1. Leave Title field blank<br>2. Click Save | Validation error ("Task title is required.") shown; empty task is not created | **Pass** |
| TC-09 | View Task | Data persistence after page refresh | 1. Add a new task<br>2. Refresh browser or logout & login again | Task remains saved in MySQL and is still visible | **Pass** |
| TC-10 | Edit Task | Update an existing task | 1. Click Edit on a task<br>2. Modify Title, Priority, or Due Date<br>3. Click Save | Updated details reflect immediately in list and database (200) | **Pass** |
| TC-11 | Task Status | Mark a Pending task as Completed | 1. Click Complete/Checkbox on a Pending task | Task status changes from `Pending` to `Completed` | **Pass** |
| TC-12 | Task Status | Reopen a Completed task | 1. Click Reopen on a Completed task | Task status changes back from `Completed` to `Pending` | **Pass** |
| TC-13 | Delete Task | Delete an existing task | 1. Click Delete on a task<br>2. Confirm deletion | Task is permanently removed from UI and MySQL database (204) | **Pass** |
| TC-14 | Search | Search task by title keyword | 1. Type a task keyword in the Search bar | Only tasks matching the searched keyword are displayed | **Fail (Not Implemented)** |
| TC-15 | Filter | Filter tasks by status | 1. Select status filter (`Pending` / `Completed`) | Only tasks with the selected status are displayed | **Pass** |
| TC-16 | Sort | Sort tasks by Due Date or Priority | 1. Select Sort option (Due Date / Priority) | Tasks rearrange in the selected order accurately | **Fail (Not Implemented)** |
| TC-17 | Privacy | User data isolation | 1. Login as User A<br>2. View Dashboard and login as User B | User A sees only their own tasks; User B sees 0 tasks (data isolated) | **Pass** |
| TC-18 | UI / Responsive | Mobile & Desktop screen check | 1. Open app on desktop screen<br>2. Resize browser to mobile width | Layout adjusts cleanly without overlapping buttons or broken text | **Pass** |

---

## 3. Additional Bugs & Missing Features Identified

### **BUG-01: Left Sidebar Navigation Links (`My Tasks`, `Completed`, `Settings`) Do Not Navigate**
- **Severity:** Medium (UI / Navigation)
- **Steps to Reproduce:**
  1. Log in to the FlowTask Dashboard.
  2. Click on `My Tasks`, `Completed`, or `Settings` in the left navigation sidebar.
- **Expected Result:** Clicking each menu item should navigate to its respective view/page and highlight the active state.
- **Actual Result:** Clicking any of these links appends `#` to the URL (`http://127.0.0.1:5000/#`), keeps `Dashboard` highlighted as active, and remains on the Dashboard Overview without opening a Settings page.

### **BUG-02: Task Creation Allows Past Due Dates Without Validation**
- **Severity:** Medium (Input Validation)
- **Steps to Reproduce:**
  1. Click `+ Add Task`.
  2. Enter a valid Task Title and select a past Due Date (e.g., `01-11-2026` when the current date is `21-11-2026`).
  3. Click `Save Task`.
- **Expected Result:** System should block past due dates and display a validation message (e.g., *"Due date cannot be in the past"*).
- **Actual Result:** The task is created and saved as `Pending` with a past due date.

### **BUG-03: Duplicate Validation Error Message on Invalid Login**
- **Severity:** Low (UI / Cosmetic)
- **Steps to Reproduce:**
  1. Open the Login page (`Log in to FlowTask`).
  2. Enter an invalid email/password combination and click `Log In`.
- **Expected Result:** A single error message (`Invalid email or password`) should be displayed.
- **Actual Result:** The exact same `"Invalid email or password"` error message appears twice simultaneously (once inside an alert box and once as plain text directly below it).