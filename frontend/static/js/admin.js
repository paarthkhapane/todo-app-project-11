/**
 * FlowTask - Administrator Dashboard JavaScript (Phase 3)
 * Handles client-side authorization, navigation tabs, metrics rendering,
 * user search/management, task moderation, and API integration.
 */

document.addEventListener("DOMContentLoaded", function () {

    // ========================================================
    // 1. Client-Side Authorization & Identity Verification
    // ========================================================
    const token = window.FlowAuth ? window.FlowAuth.getToken() : null;
    const currentUser = window.FlowAuth ? window.FlowAuth.getUser() : null;

    if (!token || !currentUser) {
        window.location.replace("/login");
        return;
    }

    if (currentUser.role !== "admin") {
        // Strict guard: regular users attempting access are redirected to user workspace
        alert("Access forbidden: Administrator privileges are required to view this page.");
        window.location.replace("/");
        return;
    }

    // Set Admin Profile Info
    const adminNameEl = document.getElementById("admin-user-name");
    if (adminNameEl) {
        adminNameEl.textContent = currentUser.name || "Administrator";
    }

    // Date Element
    const dateEl = document.getElementById("admin-date");
    if (dateEl) {
        const today = new Date();
        dateEl.textContent = today.toLocaleDateString("en-IN", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric"
        });
    }

    // ========================================================
    // 2. DOM Elements & State
    // ========================================================
    let currentTab = "overview";
    let activeDeleteUserId = null;
    let activeDeleteTaskId = null;
    let activeEditTaskId = null;

    // Navigation Items
    const navItems = document.querySelectorAll(".sidebar-nav .nav-item[data-tab]");
    const tabContents = document.querySelectorAll(".admin-tab-content");
    const viewTitleEl = document.getElementById("admin-view-title");

    // Notification Elements
    const notificationContainer = document.getElementById("admin-notification");
    const notificationBody = document.getElementById("admin-notification-body");
    const notificationIcon = document.getElementById("admin-notification-icon");
    const notificationMsg = document.getElementById("admin-notification-message");
    const notificationClose = document.getElementById("admin-notification-close");

    // Overview Elements
    const refreshStatsBtn = document.getElementById("refresh-stats-btn");
    const statTotalUsers = document.getElementById("stat-total-users");
    const statUsersDesc = document.getElementById("stat-users-desc");
    const statTotalTasks = document.getElementById("stat-total-tasks");
    const statPendingTasks = document.getElementById("stat-pending-tasks");
    const statInProgressTasks = document.getElementById("stat-in-progress-tasks");
    const statCompletedTasks = document.getElementById("stat-completed-tasks");
    const statCompletionRate = document.getElementById("stat-completion-rate");
    const priorityCountHigh = document.getElementById("priority-count-high");
    const priorityCountMedium = document.getElementById("priority-count-medium");
    const priorityCountLow = document.getElementById("priority-count-low");
    const progressBarHigh = document.getElementById("progress-bar-high");
    const progressBarMedium = document.getElementById("progress-bar-medium");
    const progressBarLow = document.getElementById("progress-bar-low");
    const recentUsersContainer = document.getElementById("recent-users-container");

    // Users Management Elements
    const usersSearchInput = document.getElementById("users-search-input");
    const usersRoleFilter = document.getElementById("users-role-filter");
    const usersCountBadge = document.getElementById("users-count-badge");
    const usersListContainer = document.getElementById("users-list-container");

    // Tasks Management Elements
    const tasksSearchInput = document.getElementById("tasks-search-input");
    const tasksStatusFilter = document.getElementById("tasks-status-filter");
    const tasksPriorityFilter = document.getElementById("tasks-priority-filter");
    const tasksCountBadge = document.getElementById("tasks-count-badge");
    const allTasksContainer = document.getElementById("all-tasks-container");

    // Delete User Modal Elements
    const deleteUserModal = document.getElementById("delete-user-modal");
    const deleteUserTargetName = document.getElementById("delete-user-target-name");
    const deleteUserTargetEmail = document.getElementById("delete-user-target-email");
    const deleteUserError = document.getElementById("delete-user-error");
    const confirmDeleteUserBtn = document.getElementById("confirm-delete-user-btn");
    const cancelDeleteUserBtn = document.getElementById("cancel-delete-user-modal");
    const closeDeleteUserBtn = document.getElementById("close-delete-user-modal");

    // Delete Task Modal Elements
    const deleteTaskModal = document.getElementById("delete-task-modal");
    const deleteTaskTargetTitle = document.getElementById("delete-task-target-title");
    const deleteTaskTargetOwner = document.getElementById("delete-task-target-owner");
    const deleteTaskError = document.getElementById("delete-task-error");
    const confirmDeleteTaskBtn = document.getElementById("confirm-delete-task-btn");
    const cancelDeleteTaskBtn = document.getElementById("cancel-delete-task-modal");
    const closeDeleteTaskBtn = document.getElementById("close-delete-task-modal");

    // Edit Task Modal Elements
    const editTaskModal = document.getElementById("edit-task-modal");
    const adminTaskForm = document.getElementById("admin-task-form");
    const adminEditTitle = document.getElementById("admin-edit-title");
    const adminEditStatus = document.getElementById("admin-edit-status");
    const adminEditPriority = document.getElementById("admin-edit-priority");
    const adminEditDescription = document.getElementById("admin-edit-description");
    const adminEditTaskError = document.getElementById("admin-edit-task-error");
    const cancelEditTaskModal = document.getElementById("cancel-edit-task-modal");
    const closeEditTaskModal = document.getElementById("close-edit-task-modal");

    // Logout Buttons
    const sidebarLogoutBtn = document.getElementById("admin-sidebar-logout");
    const headerLogoutBtn = document.getElementById("admin-header-logout");
    const mobileLogoutBtn = document.getElementById("admin-mobile-logout");


    // ========================================================
    // 3. Authenticated Admin API Client
    // ========================================================
    async function adminApiRequest(endpoint, options = {}) {
        const headers = {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
            ...(options.headers || {})
        };

        const response = await fetch(endpoint, {
            ...options,
            headers: headers
        });

        if (response.status === 401) {
            window.FlowAuth.logout("/login");
            throw new Error("Session expired. Please log in again.");
        }

        if (response.status === 403) {
            showNotification("Access forbidden: Administrator privileges required.", "error");
            throw new Error("Forbidden");
        }

        return response;
    }


    // ========================================================
    // 4. Utility & Notification Helpers
    // ========================================================
    function escapeHtml(str) {
        if (str === null || str === undefined) return "";
        return String(str)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function capitalize(str) {
        if (!str) return "";
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    function formatDisplayDate(dateStr) {
        if (!dateStr) return "N/A";
        try {
            const dateObj = new Date(dateStr.length === 10 ? `${dateStr}T12:00:00` : dateStr);
            if (isNaN(dateObj.getTime())) return dateStr;
            return dateObj.toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric"
            });
        } catch (e) {
            return dateStr;
        }
    }

    function showNotification(message, type = "info") {
        if (!notificationContainer || !notificationMsg) return;

        notificationMsg.textContent = message;
        notificationContainer.hidden = false;

        if (notificationBody) {
            notificationBody.className = `notification notification-${type === "error" ? "error" : "success"}`;
        }
        if (notificationIcon) {
            notificationIcon.textContent = type === "error" ? "⚠️" : "✅";
        }

        // Auto-dismiss after 6 seconds
        setTimeout(function () {
            if (notificationContainer) {
                notificationContainer.hidden = true;
            }
        }, 6000);
    }

    if (notificationClose) {
        notificationClose.addEventListener("click", function () {
            if (notificationContainer) {
                notificationContainer.hidden = true;
            }
        });
    }


    // ========================================================
    // 5. Navigation & Tab Switching
    // ========================================================
    function switchTab(tabName) {
        currentTab = tabName;

        navItems.forEach(function (btn) {
            const matches = btn.dataset.tab === tabName;
            btn.classList.toggle("is-active", matches);
            btn.classList.toggle("active", matches);
            btn.setAttribute("aria-current", matches ? "page" : "false");
        });

        tabContents.forEach(function (sec) {
            sec.hidden = sec.id !== `tab-admin-${tabName}`;
        });

        if (viewTitleEl) {
            if (tabName === "overview") viewTitleEl.textContent = "System Overview";
            if (tabName === "users") viewTitleEl.textContent = "User Management";
            if (tabName === "tasks") viewTitleEl.textContent = "Cross-Workspace Tasks";
        }

        // Fetch data for the active tab
        if (tabName === "overview") fetchStats();
        if (tabName === "users") fetchUsers();
        if (tabName === "tasks") fetchTasks();
    }

    navItems.forEach(function (item) {
        item.addEventListener("click", function (event) {
            event.preventDefault();
            switchTab(item.dataset.tab);
        });
    });

    // Delegated trigger for "View All Users" from overview
    document.addEventListener("click", function (e) {
        const viewAllUsersBtn = e.target.closest("[data-action='view-all-users']");
        if (viewAllUsersBtn) {
            e.preventDefault();
            switchTab("users");
        }
    });


    // ========================================================
    // 6. Overview Tab: Metrics & Distributions
    // ========================================================
    async function fetchStats() {
        try {
            const res = await adminApiRequest("/api/admin/stats");
            if (!res.ok) return;

            const stats = await res.json();

            if (statTotalUsers) statTotalUsers.textContent = stats.total_users;
            if (statUsersDesc) {
                statUsersDesc.textContent = `${stats.regular_user_count} regular, ${stats.admin_count} admin`;
            }
            if (statTotalTasks) statTotalTasks.textContent = stats.total_tasks;
            if (statPendingTasks) statPendingTasks.textContent = stats.pending_tasks;
            if (statInProgressTasks) statInProgressTasks.textContent = stats.in_progress_tasks;
            if (statCompletedTasks) statCompletedTasks.textContent = stats.completed_tasks;
            if (statCompletionRate) statCompletionRate.textContent = `${stats.completion_rate}%`;

            // Priority distribution
            const pb = stats.priority_breakdown || { high: 0, medium: 0, low: 0 };
            const totalTasks = stats.total_tasks || 1;

            if (priorityCountHigh) priorityCountHigh.textContent = pb.high || 0;
            if (priorityCountMedium) priorityCountMedium.textContent = pb.medium || 0;
            if (priorityCountLow) priorityCountLow.textContent = pb.low || 0;

            if (progressBarHigh) {
                progressBarHigh.style.width = `${Math.round(((pb.high || 0) / totalTasks) * 100)}%`;
            }
            if (progressBarMedium) {
                progressBarMedium.style.width = `${Math.round(((pb.medium || 0) / totalTasks) * 100)}%`;
            }
            if (progressBarLow) {
                progressBarLow.style.width = `${Math.round(((pb.low || 0) / totalTasks) * 100)}%`;
            }

            // Recent users
            if (recentUsersContainer) {
                if (!stats.recent_users || stats.recent_users.length === 0) {
                    recentUsersContainer.innerHTML = `<div class="empty-state-small muted">No users registered yet.</div>`;
                } else {
                    recentUsersContainer.innerHTML = stats.recent_users.map(function (u) {
                        return `
                            <div class="recent-user-item">
                                <div class="recent-user-meta">
                                    <h4>${escapeHtml(u.name)}</h4>
                                    <p>${escapeHtml(u.email)} · Joined ${escapeHtml(formatDisplayDate(u.created_at))}</p>
                                </div>
                                <div class="recent-user-stats">
                                    <span class="badge ${u.role === 'admin' ? 'badge-primary' : 'badge-info'}">
                                        ${escapeHtml(capitalize(u.role))}
                                    </span>
                                    <span class="muted small">${u.task_count || 0} tasks</span>
                                </div>
                            </div>
                        `;
                    }).join("");
                }
            }

        } catch (err) {
            console.error("Error fetching admin stats:", err);
        }
    }

    if (refreshStatsBtn) {
        refreshStatsBtn.addEventListener("click", function () {
            refreshStatsBtn.disabled = true;
            fetchStats().finally(function () {
                refreshStatsBtn.disabled = false;
            });
        });
    }


    // ========================================================
    // 7. Users Tab: Search, List, & Deletion
    // ========================================================
    async function fetchUsers() {
        if (!usersListContainer) return;
        usersListContainer.innerHTML = `<div class="empty-state loading-state"><div class="loading-spinner"></div><p>Loading user accounts...</p></div>`;

        const q = usersSearchInput ? usersSearchInput.value.trim() : "";
        const role = usersRoleFilter ? usersRoleFilter.value : "all";

        const params = new URLSearchParams();
        if (q) params.set("q", q);
        if (role !== "all") params.set("role", role);

        try {
            const res = await adminApiRequest(`/api/admin/users?${params.toString()}`);
            if (!res.ok) {
                usersListContainer.innerHTML = `<div class="empty-state error-state"><p class="muted">Failed to load users.</p></div>`;
                return;
            }

            const users = await res.json();
            if (usersCountBadge) usersCountBadge.textContent = `${users.length} Users`;

            if (users.length === 0) {
                usersListContainer.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-state-content">
                            <h3>No users found</h3>
                            <p class="muted">No user records matched your current search filters.</p>
                        </div>
                    </div>
                `;
                return;
            }

            const rowsHtml = users.map(function (u) {
                const isSelf = Boolean(u.is_current_admin || String(u.id) === String(currentUser.id));
                const roleBadgeClass = u.role === "admin" ? "badge-primary" : "badge-info";

                return `
                    <tr data-user-id="${escapeHtml(String(u.id))}">
                        <td>
                            <div class="table-cell-title">${escapeHtml(u.name)}</div>
                            <div class="table-cell-subtitle">ID: #${escapeHtml(String(u.id))}</div>
                        </td>
                        <td>
                            <code>${escapeHtml(u.email)}</code>
                        </td>
                        <td>
                            <span class="badge ${roleBadgeClass}">${escapeHtml(capitalize(u.role))}</span>
                        </td>
                        <td>
                            ${escapeHtml(formatDisplayDate(u.created_at))}
                        </td>
                        <td>
                            <strong>${escapeHtml(String(u.task_count || 0))}</strong>
                            <span class="muted small">(${escapeHtml(String(u.completed_task_count || 0))} done)</span>
                        </td>
                        <td>
                            <div class="table-actions">
                                ${isSelf ? `
                                    <button class="btn btn-secondary btn-sm" disabled title="You cannot delete your own admin account">
                                        Current Admin
                                    </button>
                                ` : `
                                    <button
                                        type="button"
                                        class="btn btn-danger-soft btn-sm"
                                        data-action="delete-user"
                                        data-user-id="${escapeHtml(String(u.id))}"
                                        data-user-name="${escapeHtml(u.name)}"
                                        data-user-email="${escapeHtml(u.email)}"
                                    >
                                        Delete User
                                    </button>
                                `}
                            </div>
                        </td>
                    </tr>
                `;
            }).join("");

            usersListContainer.innerHTML = `
                <div class="admin-table-container">
                    <table class="admin-table">
                        <thead>
                            <tr>
                                <th>User</th>
                                <th>Email</th>
                                <th>Role</th>
                                <th>Registered</th>
                                <th>Tasks</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${rowsHtml}
                        </tbody>
                    </table>
                </div>
            `;

        } catch (err) {
            console.error("Error loading users:", err);
            usersListContainer.innerHTML = `<div class="empty-state error-state"><p class="muted">Connection error loading users.</p></div>`;
        }
    }

    if (usersSearchInput) {
        let debounceTimer;
        usersSearchInput.addEventListener("input", function () {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(fetchUsers, 250);
        });
    }

    if (usersRoleFilter) {
        usersRoleFilter.addEventListener("change", fetchUsers);
    }

    // Handle Delete User Click
    document.addEventListener("click", function (e) {
        const deleteBtn = e.target.closest("[data-action='delete-user']");
        if (deleteBtn) {
            activeDeleteUserId = deleteBtn.dataset.userId;
            const name = deleteBtn.dataset.userName || "User";
            const email = deleteBtn.dataset.userEmail || "";

            if (deleteUserTargetName) deleteUserTargetName.textContent = name;
            if (deleteUserTargetEmail) deleteUserTargetEmail.textContent = email;
            if (deleteUserError) deleteUserError.hidden = true;

            if (deleteUserModal) {
                deleteUserModal.hidden = false;
                document.body.style.overflow = "hidden";
            }
        }
    });

    function closeDeleteUserModal() {
        if (deleteUserModal) {
            deleteUserModal.hidden = true;
            document.body.style.overflow = "";
            activeDeleteUserId = null;
        }
    }

    if (cancelDeleteUserBtn) cancelDeleteUserBtn.addEventListener("click", closeDeleteUserModal);
    if (closeDeleteUserBtn) closeDeleteUserBtn.addEventListener("click", closeDeleteUserModal);

    if (confirmDeleteUserBtn) {
        confirmDeleteUserBtn.addEventListener("click", async function () {
            if (!activeDeleteUserId) return;

            confirmDeleteUserBtn.disabled = true;
            confirmDeleteUserBtn.textContent = "Deleting...";

            try {
                const res = await adminApiRequest(`/api/admin/users/${activeDeleteUserId}`, {
                    method: "DELETE"
                });

                const data = await res.json().catch(function () { return {}; });

                if (res.ok) {
                    closeDeleteUserModal();
                    showNotification(data.message || "User deleted successfully.", "success");
                    fetchUsers();
                    fetchStats();
                } else {
                    if (deleteUserError) {
                        deleteUserError.hidden = false;
                        deleteUserError.textContent = data.error || "Failed to delete user.";
                    }
                }
            } catch (err) {
                if (deleteUserError) {
                    deleteUserError.hidden = false;
                    deleteUserError.textContent = "Network error while deleting user.";
                }
            } finally {
                confirmDeleteUserBtn.disabled = false;
                confirmDeleteUserBtn.textContent = "Delete User";
            }
        });
    }


    // ========================================================
    // 8. All Tasks Tab: Search, Filter, Status Toggle, Edit, Delete
    // ========================================================
    let cachedAdminTasks = [];

    async function fetchTasks() {
        if (!allTasksContainer) return;
        allTasksContainer.innerHTML = `<div class="empty-state loading-state"><div class="loading-spinner"></div><p>Loading all workspace tasks...</p></div>`;

        const q = tasksSearchInput ? tasksSearchInput.value.trim() : "";
        const status = tasksStatusFilter ? tasksStatusFilter.value : "all";
        const priority = tasksPriorityFilter ? tasksPriorityFilter.value : "all";

        const params = new URLSearchParams();
        if (q) params.set("q", q);
        if (status !== "all") params.set("status", status);
        if (priority !== "all") params.set("priority", priority);

        try {
            const res = await adminApiRequest(`/api/admin/tasks?${params.toString()}`);
            if (!res.ok) {
                allTasksContainer.innerHTML = `<div class="empty-state error-state"><p class="muted">Failed to load tasks.</p></div>`;
                return;
            }

            const tasks = await res.json();
            cachedAdminTasks = tasks;
            if (tasksCountBadge) tasksCountBadge.textContent = `${tasks.length} Tasks`;

            if (tasks.length === 0) {
                allTasksContainer.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-state-content">
                            <h3>No tasks found</h3>
                            <p class="muted">No task records matched your current search filters.</p>
                        </div>
                    </div>
                `;
                return;
            }

            const rowsHtml = tasks.map(function (t) {
                const isCompleted = String(t.status || "").toLowerCase() === "completed";
                const isInProgress = String(t.status || "").toLowerCase() === "in_progress";
                let statusBadgeClass = "badge-warning";
                if (isCompleted) statusBadgeClass = "badge-success";
                if (isInProgress) statusBadgeClass = "badge-info";

                const priority = String(t.priority || "medium").toLowerCase();
                const priorityClass = `priority-${priority}`;

                return `
                    <tr data-task-id="${escapeHtml(String(t.id))}">
                        <td>
                            <div class="table-cell-title">${escapeHtml(t.title)}</div>
                            ${t.description ? `<div class="table-cell-subtitle">${escapeHtml(t.description)}</div>` : ""}
                        </td>
                        <td>
                            <div class="table-cell-title">${escapeHtml(t.user_name || "Unknown")}</div>
                            <div class="table-cell-subtitle">${escapeHtml(t.user_email || "")}</div>
                        </td>
                        <td>
                            ${t.category ? `<span class="badge-category">📁 ${escapeHtml(t.category)}</span>` : `<span class="muted small">—</span>`}
                        </td>
                        <td>
                            <span class="priority-badge ${priorityClass}">${escapeHtml(capitalize(priority))}</span>
                        </td>
                        <td>
                            <span class="badge ${statusBadgeClass}">${escapeHtml(capitalize(t.status || "pending"))}</span>
                        </td>
                        <td>
                            ${escapeHtml(formatDisplayDate(t.due_date))}
                        </td>
                        <td>
                            <div class="table-actions">
                                <button
                                    type="button"
                                    class="btn btn-secondary btn-sm"
                                    data-action="toggle-admin-task"
                                    data-task-id="${escapeHtml(String(t.id))}"
                                    data-current-status="${escapeHtml(t.status || 'pending')}"
                                >
                                    ${isCompleted ? "Reopen" : "Complete"}
                                </button>
                                <button
                                    type="button"
                                    class="btn btn-secondary btn-sm"
                                    data-action="edit-admin-task"
                                    data-task-id="${escapeHtml(String(t.id))}"
                                >
                                    Edit
                                </button>
                                <button
                                    type="button"
                                    class="btn btn-danger-soft btn-sm"
                                    data-action="delete-admin-task"
                                    data-task-id="${escapeHtml(String(t.id))}"
                                    data-task-title="${escapeHtml(t.title)}"
                                    data-task-owner="${escapeHtml(t.user_email || 'User')}"
                                >
                                    Delete
                                </button>
                            </div>
                        </td>
                    </tr>
                `;
            }).join("");

            allTasksContainer.innerHTML = `
                <div class="admin-table-container">
                    <table class="admin-table">
                        <thead>
                            <tr>
                                <th>Task</th>
                                <th>Owner</th>
                                <th>Category</th>
                                <th>Priority</th>
                                <th>Status</th>
                                <th>Due Date</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${rowsHtml}
                        </tbody>
                    </table>
                </div>
            `;

        } catch (err) {
            console.error("Error loading tasks:", err);
            allTasksContainer.innerHTML = `<div class="empty-state error-state"><p class="muted">Connection error loading tasks.</p></div>`;
        }
    }

    if (tasksSearchInput) {
        let debounceTimer;
        tasksSearchInput.addEventListener("input", function () {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(fetchTasks, 250);
        });
    }

    if (tasksStatusFilter) tasksStatusFilter.addEventListener("change", fetchTasks);
    if (tasksPriorityFilter) tasksPriorityFilter.addEventListener("change", fetchTasks);

    // Task Actions: Toggle status, Edit, Delete
    document.addEventListener("click", async function (e) {
        // 1. Toggle status
        const toggleBtn = e.target.closest("[data-action='toggle-admin-task']");
        if (toggleBtn) {
            const taskId = toggleBtn.dataset.taskId;
            const currentStatus = toggleBtn.dataset.currentStatus;
            const nextStatus = currentStatus === "completed" ? "pending" : "completed";

            toggleBtn.disabled = true;
            try {
                const res = await adminApiRequest(`/api/admin/tasks/${taskId}`, {
                    method: "PUT",
                    body: JSON.stringify({ status: nextStatus })
                });

                if (res.ok) {
                    showNotification(`Task marked as ${nextStatus}.`, "success");
                    fetchTasks();
                    fetchStats();
                } else {
                    showNotification("Failed to update task status.", "error");
                }
            } catch (err) {
                showNotification("Network error updating task status.", "error");
            } finally {
                toggleBtn.disabled = false;
            }
            return;
        }

        // 2. Edit task
        const editBtn = e.target.closest("[data-action='edit-admin-task']");
        if (editBtn) {
            const taskId = editBtn.dataset.taskId;
            const task = cachedAdminTasks.find(function (t) { return String(t.id) === String(taskId); });
            if (!task) return;

            activeEditTaskId = taskId;
            if (adminEditTitle) adminEditTitle.value = task.title || "";
            if (adminEditStatus) adminEditStatus.value = task.status || "pending";
            if (adminEditPriority) adminEditPriority.value = task.priority || "medium";
            if (adminEditDescription) adminEditDescription.value = task.description || "";
            if (adminEditTaskError) adminEditTaskError.hidden = true;

            if (editTaskModal) {
                editTaskModal.hidden = false;
                document.body.style.overflow = "hidden";
            }
            return;
        }

        // 3. Delete task
        const deleteBtn = e.target.closest("[data-action='delete-admin-task']");
        if (deleteBtn) {
            activeDeleteTaskId = deleteBtn.dataset.taskId;
            const title = deleteBtn.dataset.taskTitle || "Task";
            const owner = deleteBtn.dataset.taskOwner || "";

            if (deleteTaskTargetTitle) deleteTaskTargetTitle.textContent = title;
            if (deleteTaskTargetOwner) deleteTaskTargetOwner.textContent = `Owner: ${owner}`;
            if (deleteTaskError) deleteTaskError.hidden = true;

            if (deleteTaskModal) {
                deleteTaskModal.hidden = false;
                document.body.style.overflow = "hidden";
            }
            return;
        }
    });

    // Edit Task Modal logic
    function closeEditTaskModalFunc() {
        if (editTaskModal) {
            editTaskModal.hidden = true;
            document.body.style.overflow = "";
            activeEditTaskId = null;
        }
    }

    if (cancelEditTaskModal) cancelEditTaskModal.addEventListener("click", closeEditTaskModalFunc);
    if (closeEditTaskModal) closeEditTaskModal.addEventListener("click", closeEditTaskModalFunc);

    if (adminTaskForm) {
        adminTaskForm.addEventListener("submit", async function (e) {
            e.preventDefault();
            if (!activeEditTaskId) return;

            const saveBtn = document.getElementById("save-admin-task-btn");
            if (saveBtn) {
                saveBtn.disabled = true;
                saveBtn.textContent = "Saving...";
            }

            const payload = {
                title: adminEditTitle.value.trim(),
                status: adminEditStatus.value,
                priority: adminEditPriority.value,
                description: adminEditDescription.value.trim()
            };

            try {
                const res = await adminApiRequest(`/api/admin/tasks/${activeEditTaskId}`, {
                    method: "PUT",
                    body: JSON.stringify(payload)
                });

                const data = await res.json().catch(function () { return {}; });

                if (res.ok) {
                    closeEditTaskModalFunc();
                    showNotification("Task updated successfully by administrator.", "success");
                    fetchTasks();
                    fetchStats();
                } else {
                    if (adminEditTaskError) {
                        adminEditTaskError.hidden = false;
                        adminEditTaskError.textContent = data.error || "Failed to update task.";
                    }
                }
            } catch (err) {
                if (adminEditTaskError) {
                    adminEditTaskError.hidden = false;
                    adminEditTaskError.textContent = "Network error while updating task.";
                }
            } finally {
                if (saveBtn) {
                    saveBtn.disabled = false;
                    saveBtn.textContent = "Save Changes";
                }
            }
        });
    }

    // Delete Task Modal logic
    function closeDeleteTaskModalFunc() {
        if (deleteTaskModal) {
            deleteTaskModal.hidden = true;
            document.body.style.overflow = "";
            activeDeleteTaskId = null;
        }
    }

    if (cancelDeleteTaskBtn) cancelDeleteTaskBtn.addEventListener("click", closeDeleteTaskModalFunc);
    if (closeDeleteTaskBtn) closeDeleteTaskBtn.addEventListener("click", closeDeleteTaskModalFunc);

    if (confirmDeleteTaskBtn) {
        confirmDeleteTaskBtn.addEventListener("click", async function () {
            if (!activeDeleteTaskId) return;

            confirmDeleteTaskBtn.disabled = true;
            confirmDeleteTaskBtn.textContent = "Deleting...";

            try {
                const res = await adminApiRequest(`/api/admin/tasks/${activeDeleteTaskId}`, {
                    method: "DELETE"
                });

                const data = await res.json().catch(function () { return {}; });

                if (res.ok) {
                    closeDeleteTaskModalFunc();
                    showNotification(data.message || "Task deleted successfully.", "success");
                    fetchTasks();
                    fetchStats();
                } else {
                    if (deleteTaskError) {
                        deleteTaskError.hidden = false;
                        deleteTaskError.textContent = data.error || "Failed to delete task.";
                    }
                }
            } catch (err) {
                if (deleteTaskError) {
                    deleteTaskError.hidden = false;
                    deleteTaskError.textContent = "Network error while deleting task.";
                }
            } finally {
                confirmDeleteTaskBtn.disabled = false;
                confirmDeleteTaskBtn.textContent = "Delete Task";
            }
        });
    }


    // ========================================================
    // 9. Logout Handlers
    // ========================================================
    function handleAdminLogout(e) {
        if (e) e.preventDefault();
        window.FlowAuth.logout("/login");
    }

    if (sidebarLogoutBtn) sidebarLogoutBtn.addEventListener("click", handleAdminLogout);
    if (headerLogoutBtn) headerLogoutBtn.addEventListener("click", handleAdminLogout);
    if (mobileLogoutBtn) mobileLogoutBtn.addEventListener("click", handleAdminLogout);


    // ========================================================
    // 10. Initial Data Load
    // ========================================================
    fetchStats();
});
