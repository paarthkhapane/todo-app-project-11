# QA Master Test Cases & Execution Report
**Executed By:** Karishma Nandan Singh Bora  
**Task ID:** T-002  
**Tech Stack:** Python Flask + Jinja Templates + MySQL  

## 1. Test Execution Summary
- **Total Test Cases:** 18
- **Passed:** 18
- **Failed:** 0

---

## 2. Master Test Cases Table

| Test ID | Module | Test Scenario | Expected Result | Actual Result | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **TC-01** | Auth | User Registration with valid details | Account created and redirected to Login/Dashboard | User registered and saved in MySQL database | **Pass** |
| **TC-02** | Auth | Registration with existing email | Validation error shown for duplicate email | Error message displayed preventing duplicate account | **Pass** |
| **TC-03** | Auth | Registration with empty fields | Form prevents submission and highlights required fields | Required field validation triggered properly | **Pass** |
| **TC-04** | Auth | User Login with valid credentials | User logged in and redirected to Dashboard | Logged in successfully; dashboard loaded | **Pass** |
| **TC-05** | Auth | User Login with invalid password | Error message displayed; access denied | Single clear `"Invalid email or password"` alert shown | **Pass** |
| **TC-06** | Auth | Protected route access without login | Redirected to Login page | Redirected properly to `/login` | **Pass** |
| **TC-07** | Auth | User Logout | Session cleared and redirected to Login page | Session ended and redirected to login screen | **Pass** |
| **TC-08** | Tasks | Create a new task with valid details | Task added to list and saved in database | Task `"Persistence Test"` created and displayed | **Pass** |
| **TC-09** | Tasks | Create task without title | Form validation prevents empty title submission | Validation prevented creating empty task | **Pass** |
| **TC-10** | Tasks | Edit an existing task | Updated details saved and reflected in UI | Title, priority, and due date updated accurately | **Pass** |
| **TC-11** | Tasks | Mark a task as Completed | Status changes to Completed and stats update | Task marked Completed; summary counters updated | **Pass** |
| **TC-12** | Tasks | Delete a task | Task removed from UI and database | Task deleted permanently after confirmation | **Pass** |
| **TC-13** | Filter | Filter tasks by status (All / Pending / Completed) | Only matching tasks displayed | Tabs correctly filtered All, Pending, and Completed tasks | **Pass** |
| **TC-14** | Search | Search tasks by title | Matching tasks displayed in real-time | Search bar accurately filtered tasks by title | **Pass** |
| **TC-15** | Filter | Filter tasks by Priority / Category | Tasks filtered based on selected priority/category | Filtered tasks accurately by priority and category | **Pass** |
| **TC-16** | Sort | Sort tasks by Due Date / Priority | Tasks reordered according to selected sort criteria | Sort dropdown (Default, Due Date, Priority High/Low) worked properly | **Pass** |
| **TC-17** | Security | Multi-user data isolation | User A cannot view or modify User B's tasks | Each user only saw their own tasks | **Pass** |
| **TC-18** | Persistence | Data persistence across sessions | Tasks remain intact after logout and re-login | All tasks and statuses persisted after re-login | **Pass** |