/**
 * FlowTask - Dashboard & Task Management Frontend Foundation (Phase 2A)
 * Manages task display rendering, filter switching, Add/Edit modal,
 * Delete confirmation modal, accessible UI states, and responsive controls.
 */

document.addEventListener("DOMContentLoaded", function () {

    // ========================================================
    // 1. In-Memory State & Context
    // ========================================================
    // Tasks array is unpopulated by default for honest Phase 2A presentation
    let tasks = [];
    let currentFilter = "all"; // "all" | "pending" | "completed"
    let activeEditingTaskId = null;
    let activeDeletingTaskId = null;
    let lastFocusedElement = null;

    // DOM Elements - Headers & Navigation
    const dateElement = document.getElementById("dashboard-date");
    const filterButtons = document.querySelectorAll("[data-filter]");
    const navMyTasks = document.getElementById("nav-my-tasks");
    const navCompleted = document.getElementById("nav-completed");

    // DOM Elements - Statistics
    const totalTasksEl = document.getElementById("total-tasks");
    const pendingTasksEl = document.getElementById("pending-tasks");
    const completedTasksEl = document.getElementById("completed-tasks");

    // DOM Elements - Task Container
    const taskContainer = document.getElementById("task-container");

    // DOM Elements - Add/Edit Task Modal
    const taskModal = document.getElementById("task-modal");
    const taskForm = document.getElementById("task-form");
    const taskModalEyebrow = document.getElementById("task-modal-eyebrow");
    const taskModalTitle = document.getElementById("task-modal-title");
    const taskModalSubtitle = document.getElementById("task-modal-subtitle");
    const taskTitleInput = document.getElementById("task-title");
    const taskDescInput = document.getElementById("task-description");
    const taskPriorityInput = document.getElementById("task-priority");
    const taskDateInput = document.getElementById("task-due-date");
    const taskModalFeedback = document.getElementById("task-modal-feedback");
    const saveTaskBtn = document.getElementById("save-task-btn");
    const closeTaskModalBtn = document.getElementById("close-task-modal");
    const cancelTaskModalBtn = document.getElementById("cancel-task-modal");
    const addTaskBtn = document.getElementById("add-task-btn");

    // DOM Elements - Delete Confirmation Modal
    const deleteModal = document.getElementById("delete-modal");
    const deleteModalTitle = document.getElementById("delete-modal-title");
    const deleteTaskTarget = document.getElementById("delete-task-target");
    const deleteModalFeedback = document.getElementById("delete-modal-feedback");
    const confirmDeleteBtn = document.getElementById("confirm-delete-btn");
    const closeDeleteModalBtn = document.getElementById("close-delete-modal");
    const cancelDeleteModalBtn = document.getElementById("cancel-delete-modal");

    // ========================================================
    // 2. Date & Formatting Helpers
    // ========================================================
    if (dateElement) {
        const today = new Date();
        dateElement.textContent = today.toLocaleDateString("en-IN", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric"
        });
    }

    function formatDisplayDate(dateStr) {
        if (!dateStr) return "No due date";
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

    function escapeHtml(str) {
        if (str === null || str === undefined) return "";
        return String(str).replace(/[&<>"']/g, function (match) {
            return {
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#39;"
            }[match];
        });
    }

    function capitalize(str) {
        if (!str) return "";
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    // ========================================================
    // 3. Task Rendering & Card Templates
    // ========================================================

    /**
     * Renders a single task card following the FlowTask design tokens
     */
    function renderTaskCard(task) {
        const isCompleted = String(task.status || "pending").toLowerCase() === "completed";
        const priority = String(task.priority || "medium").toLowerCase();
        const priorityClass = `priority-${priority}`;
        const statusClass = isCompleted ? "badge-success" : "badge-warning";
        const statusLabel = isCompleted ? "Completed" : "Pending";
        const formattedDate = formatDisplayDate(task.due_date);

        return `
            <article class="task-card ${isCompleted ? 'is-completed' : ''}" data-task-id="${escapeHtml(String(task.id))}">
                <div class="task-card-header">
                    <span class="badge ${statusClass}">${escapeHtml(statusLabel)}</span>
                    <span class="priority-badge ${priorityClass}">${escapeHtml(capitalize(priority))} Priority</span>
                </div>
                <h3 class="task-card-title">${escapeHtml(task.title)}</h3>
                <p class="task-card-desc">${escapeHtml(task.description || "No description provided.")}</p>
                <div class="task-card-meta">
                    <span class="due-date">📅 Due ${escapeHtml(formattedDate)}</span>
                </div>
                <div class="task-card-actions">
                    <button type="button" class="btn btn-secondary btn-sm" data-action="toggle-status" data-task-id="${escapeHtml(String(task.id))}">
                        ${isCompleted ? "Reopen" : "Mark Complete"}
                    </button>
                    <button type="button" class="btn btn-secondary btn-sm" data-action="edit" data-task-id="${escapeHtml(String(task.id))}">
                        Edit
                    </button>
                    <button type="button" class="btn btn-danger-soft btn-sm" data-action="delete" data-task-id="${escapeHtml(String(task.id))}">
                        Delete
                    </button>
                </div>
            </article>
        `;
    }

    /**
     * Updates statistics cards based on the current tasks in memory
     */
    function updateStatistics() {
        if (tasks.length === 0) {
            if (totalTasksEl) totalTasksEl.textContent = "--";
            if (pendingTasksEl) pendingTasksEl.textContent = "--";
            if (completedTasksEl) completedTasksEl.textContent = "--";
            return;
        }

        const total = tasks.length;
        const pending = tasks.filter(function (t) {
            return String(t.status || "pending").toLowerCase() === "pending";
        }).length;
        const completed = tasks.filter(function (t) {
            return String(t.status || "").toLowerCase() === "completed";
        }).length;

        if (totalTasksEl) totalTasksEl.textContent = String(total);
        if (pendingTasksEl) pendingTasksEl.textContent = String(pending);
        if (completedTasksEl) completedTasksEl.textContent = String(completed);
    }

    /**
     * Renders the task container according to current state and filters
     */
    function renderTaskView() {
        if (!taskContainer) return;

        // If no tasks exist in memory, show the honest empty / not-connected state
        if (tasks.length === 0) {
            if (currentFilter === "pending") {
                taskContainer.innerHTML = `
                    <div class="empty-state" id="task-empty-pending">
                        <div class="empty-state-content">
                            <div class="empty-state-icon" aria-hidden="true">
                                <span>⏳</span>
                            </div>
                            <h3>No pending tasks</h3>
                            <p class="muted">
                                There are no pending tasks right now. Once tasks are added, active items will display here.
                            </p>
                            <button class="btn btn-primary" data-action="add-task" type="button">
                                + Add a Task
                            </button>
                        </div>
                    </div>
                `;
            } else if (currentFilter === "completed") {
                taskContainer.innerHTML = `
                    <div class="empty-state" id="task-empty-completed">
                        <div class="empty-state-content">
                            <div class="empty-state-icon" aria-hidden="true">
                                <span>✅</span>
                            </div>
                            <h3>No completed tasks</h3>
                            <p class="muted">
                                You don't have any completed tasks yet. As tasks are finished, they will appear in this section.
                            </p>
                            <button class="btn btn-secondary" data-action="filter-all" type="button">
                                View All Tasks
                            </button>
                        </div>
                    </div>
                `;
            } else {
                taskContainer.innerHTML = `
                    <div class="empty-state" id="task-empty-state">
                        <div class="empty-state-content">
                            <div class="empty-state-icon" aria-hidden="true">
                                <span>✓</span>
                            </div>
                            <h3>Your tasks will appear here</h3>
                            <p class="muted">
                                Once your tasks are loaded from the backend, you can manage, filter, and track them from this dashboard.
                            </p>
                            <button class="btn btn-primary" id="empty-add-task-btn" data-action="add-task" type="button">
                                + Create Your First Task
                            </button>
                            <div class="state-badge-notice">
                                <span class="badge badge-info">Backend Integration Pending (Phase 2B)</span>
                            </div>
                        </div>
                    </div>
                `;
            }
            updateStatistics();
            return;
        }

        // Filter tasks when data is available
        const filteredTasks = tasks.filter(function (t) {
            const status = String(t.status || "pending").toLowerCase();
            if (currentFilter === "pending") return status === "pending";
            if (currentFilter === "completed") return status === "completed";
            return true;
        });

        if (filteredTasks.length === 0) {
            const filterLabel = currentFilter === "pending" ? "pending" : "completed";
            taskContainer.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-content">
                        <div class="empty-state-icon" aria-hidden="true">
                            <span>🔍</span>
                        </div>
                        <h3>No ${escapeHtml(filterLabel)} tasks found</h3>
                        <p class="muted">There are no tasks matching the selected "${escapeHtml(capitalize(currentFilter))}" filter.</p>
                        <button class="btn btn-secondary" data-action="filter-all" type="button">
                            Reset to All Tasks
                        </button>
                    </div>
                </div>
            `;
            updateStatistics();
            return;
        }

        // Render populated task grid
        const cardsHtml = filteredTasks.map(renderTaskCard).join("");
        taskContainer.innerHTML = `<div class="task-grid">${cardsHtml}</div>`;
        updateStatistics();
    }

    // ========================================================
    // 4. UI States Helpers (Loading, Error, Disconnected)
    // ========================================================
    function renderLoadingState() {
        if (!taskContainer) return;
        taskContainer.innerHTML = `
            <div class="empty-state loading-state" id="task-loading-state">
                <div class="empty-state-content">
                    <div class="loading-spinner" aria-hidden="true"></div>
                    <h3>Loading tasks...</h3>
                    <p class="muted">Connecting to task service.</p>
                </div>
            </div>
        `;
    }

    function renderErrorState(errorMessage) {
        if (!taskContainer) return;
        taskContainer.innerHTML = `
            <div class="empty-state error-state" id="task-error-state">
                <div class="empty-state-content">
                    <div class="empty-state-icon error-icon" aria-hidden="true">
                        <span>⚠️</span>
                    </div>
                    <h3>Unable to load tasks</h3>
                    <p class="muted">${escapeHtml(errorMessage || "A connection error occurred. Backend service is not yet available.")}</p>
                    <button class="btn btn-secondary" data-action="retry-tasks" type="button">
                        Retry Connection
                    </button>
                </div>
            </div>
        `;
    }

    function renderDisconnectedState() {
        if (!taskContainer) return;
        taskContainer.innerHTML = `
            <div class="empty-state" id="task-disconnected-state">
                <div class="empty-state-content">
                    <div class="empty-state-icon" aria-hidden="true">
                        <span>🔌</span>
                    </div>
                    <h3>Backend not connected</h3>
                    <p class="muted">The frontend task management UI is ready. Real-time task retrieval will activate when the backend API is connected.</p>
                    <button class="btn btn-primary" data-action="add-task" type="button">
                        + Create a Task (Preview)
                    </button>
                </div>
            </div>
        `;
    }

    // ========================================================
    // 5. Filter Handling
    // ========================================================
    function setFilter(newFilter) {
        currentFilter = newFilter;

        filterButtons.forEach(function (btn) {
            const matches = btn.dataset.filter === newFilter;
            btn.classList.toggle("active", matches);
            btn.classList.toggle("is-active", matches);
            btn.setAttribute("aria-selected", matches ? "true" : "false");
        });

        renderTaskView();
    }

    filterButtons.forEach(function (button) {
        button.addEventListener("click", function () {
            setFilter(button.dataset.filter);
        });
    });

    if (navMyTasks) {
        navMyTasks.addEventListener("click", function (event) {
            event.preventDefault();
            setFilter("all");
        });
    }

    if (navCompleted) {
        navCompleted.addEventListener("click", function (event) {
            event.preventDefault();
            setFilter("completed");
        });
    }

    // ========================================================
    // 6. Add & Edit Task Modal
    // ========================================================
    function clearModalErrors() {
        const titleError = document.getElementById("task-title-error");
        const dateError = document.getElementById("task-date-error");
        const formError = document.getElementById("task-form-error");

        if (titleError) titleError.textContent = "";
        if (dateError) dateError.textContent = "";
        if (formError) formError.textContent = "";

        if (taskTitleInput) taskTitleInput.removeAttribute("aria-invalid");
        if (taskDateInput) taskDateInput.removeAttribute("aria-invalid");

        if (taskModalFeedback) {
            taskModalFeedback.hidden = true;
            taskModalFeedback.textContent = "";
        }
    }

    function openTaskModal(mode, task) {
        if (!taskModal) return;

        closeDeleteModal();
        lastFocusedElement = document.activeElement;
        clearModalErrors();

        if (mode === "edit" && task) {
            activeEditingTaskId = task.id;
            if (taskModalEyebrow) taskModalEyebrow.textContent = "EDIT TASK";
            if (taskModalTitle) taskModalTitle.textContent = "Edit Task";
            if (taskModalSubtitle) taskModalSubtitle.textContent = "Update task details.";
            if (saveTaskBtn) saveTaskBtn.textContent = "Save Changes";

            if (taskTitleInput) taskTitleInput.value = task.title || "";
            if (taskDescInput) taskDescInput.value = task.description || "";
            if (taskPriorityInput) taskPriorityInput.value = (task.priority || "medium").toLowerCase();
            if (taskDateInput) taskDateInput.value = task.due_date ? String(task.due_date).substring(0, 10) : "";
        } else {
            activeEditingTaskId = null;
            if (taskModalEyebrow) taskModalEyebrow.textContent = "TASK DETAILS";
            if (taskModalTitle) taskModalTitle.textContent = "Add Task";
            if (taskModalSubtitle) taskModalSubtitle.textContent = "Fill in the details of your task.";
            if (saveTaskBtn) saveTaskBtn.textContent = "Save Task";

            if (taskForm) taskForm.reset();
        }

        taskModal.hidden = false;
        document.body.style.overflow = "hidden";

        if (taskTitleInput) {
            taskTitleInput.focus();
        }
    }

    function closeTaskModal() {
        if (!taskModal || taskModal.hidden) return;

        taskModal.hidden = true;
        document.body.style.overflow = "";
        activeEditingTaskId = null;

        if (taskForm) {
            taskForm.reset();
        }
        clearModalErrors();

        if (lastFocusedElement && lastFocusedElement.focus) {
            lastFocusedElement.focus();
        }
    }

    // Modal Triggers
    if (addTaskBtn) {
        addTaskBtn.addEventListener("click", function () {
            openTaskModal("add");
        });
    }

    if (closeTaskModalBtn) {
        closeTaskModalBtn.addEventListener("click", closeTaskModal);
    }

    if (cancelTaskModalBtn) {
        cancelTaskModalBtn.addEventListener("click", closeTaskModal);
    }

    if (taskModal) {
        taskModal.addEventListener("click", function (event) {
            if (event.target === taskModal) {
                closeTaskModal();
            }
        });
    }

    // Form Submission & Validation
    if (taskForm) {
        taskForm.addEventListener("submit", function (event) {
            event.preventDefault();
            clearModalErrors();

            const title = taskTitleInput ? taskTitleInput.value.trim() : "";
            const dueDate = taskDateInput ? taskDateInput.value : "";

            let isValid = true;
            let firstInvalid = null;

            if (!title) {
                const titleError = document.getElementById("task-title-error");
                if (titleError) titleError.textContent = "Task title is required.";
                if (taskTitleInput) taskTitleInput.setAttribute("aria-invalid", "true");
                isValid = false;
                if (!firstInvalid) firstInvalid = taskTitleInput;
            }

            if (!dueDate) {
                const dateError = document.getElementById("task-date-error");
                if (dateError) dateError.textContent = "Due date is required.";
                if (taskDateInput) taskDateInput.setAttribute("aria-invalid", "true");
                isValid = false;
                if (!firstInvalid) firstInvalid = taskDateInput;
            }

            if (!isValid) {
                if (firstInvalid) firstInvalid.focus();
                return;
            }

            // Simulated feedback state for Phase 2A (No fake persistence)
            if (saveTaskBtn) {
                const originalText = saveTaskBtn.textContent;
                saveTaskBtn.disabled = true;
                saveTaskBtn.textContent = activeEditingTaskId ? "Saving changes..." : "Saving task...";

                setTimeout(function () {
                    saveTaskBtn.disabled = false;
                    saveTaskBtn.textContent = originalText;

                    if (taskModalFeedback) {
                        taskModalFeedback.hidden = false;
                        taskModalFeedback.className = "auth-feedback feedback-info";
                        taskModalFeedback.textContent = activeEditingTaskId
                            ? "Form validated. Note: Backend API is not yet connected in Phase 2A. Task updates will be permanently saved once the backend is integrated."
                            : "Form validated. Note: Backend API is not yet connected in Phase 2A. Task saving will be connected to the backend in Phase 2B.";
                    }
                }, 400);
            }
        });
    }

    // ========================================================
    // 7. Delete Confirmation Modal
    // ========================================================
    function openDeleteModal(task) {
        if (!deleteModal) return;

        closeTaskModal();
        lastFocusedElement = document.activeElement;
        activeDeletingTaskId = task ? task.id : null;

        if (deleteTaskTarget) {
            if (task && task.title) {
                deleteTaskTarget.textContent = `Are you sure you want to delete "${task.title}"? All task details will be permanently removed.`;
            } else {
                deleteTaskTarget.textContent = "Are you sure you want to delete this task? All task details will be permanently removed.";
            }
        }

        if (deleteModalFeedback) {
            deleteModalFeedback.hidden = true;
            deleteModalFeedback.textContent = "";
        }

        if (confirmDeleteBtn) {
            confirmDeleteBtn.disabled = false;
            confirmDeleteBtn.textContent = "Confirm Delete";
        }

        deleteModal.hidden = false;
        document.body.style.overflow = "hidden";

        if (confirmDeleteBtn) {
            confirmDeleteBtn.focus();
        }
    }

    function closeDeleteModal() {
        if (!deleteModal || deleteModal.hidden) return;

        deleteModal.hidden = true;
        document.body.style.overflow = "";
        activeDeletingTaskId = null;

        if (deleteModalFeedback) {
            deleteModalFeedback.hidden = true;
            deleteModalFeedback.textContent = "";
        }

        if (lastFocusedElement && lastFocusedElement.focus) {
            lastFocusedElement.focus();
        }
    }

    if (closeDeleteModalBtn) {
        closeDeleteModalBtn.addEventListener("click", closeDeleteModal);
    }

    if (cancelDeleteModalBtn) {
        cancelDeleteModalBtn.addEventListener("click", closeDeleteModal);
    }

    if (deleteModal) {
        deleteModal.addEventListener("click", function (event) {
            if (event.target === deleteModal) {
                closeDeleteModal();
            }
        });
    }

    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener("click", function () {
            confirmDeleteBtn.disabled = true;
            confirmDeleteBtn.textContent = "Deleting...";

            setTimeout(function () {
                confirmDeleteBtn.disabled = false;
                confirmDeleteBtn.textContent = "Confirm Delete";

                if (deleteModalFeedback) {
                    deleteModalFeedback.hidden = false;
                    deleteModalFeedback.className = "auth-feedback feedback-warning";
                    deleteModalFeedback.textContent =
                        "Action confirmed. Note: Backend API is not yet connected in Phase 2A. Task deletion will be permanently executed when the API is wired up.";
                }
            }, 400);
        });
    }

    // Global keyboard handling (Escape closes any open modal)
    document.addEventListener("keydown", function (event) {
        if (event.key === "Escape") {
            if (taskModal && !taskModal.hidden) {
                closeTaskModal();
            } else if (deleteModal && !deleteModal.hidden) {
                closeDeleteModal();
            }
        }
    });

    // ========================================================
    // 8. Event Delegation on Task Container
    // ========================================================
    if (taskContainer) {
        taskContainer.addEventListener("click", function (event) {
            const target = event.target.closest("button");
            if (!target) return;

            const action = target.dataset.action;
            const taskId = target.dataset.taskId;

            if (action === "add-task" || target.id === "empty-add-task-btn") {
                openTaskModal("add");
            } else if (action === "filter-all") {
                setFilter("all");
            } else if (action === "retry-tasks") {
                renderLoadingState();
                setTimeout(renderTaskView, 400);
            } else if (action === "edit" && taskId) {
                const task = tasks.find(function (t) {
                    return String(t.id) === String(taskId);
                });
                if (task) {
                    openTaskModal("edit", task);
                }
            } else if (action === "delete" && taskId) {
                const task = tasks.find(function (t) {
                    return String(t.id) === String(taskId);
                });
                openDeleteModal(task || { id: taskId, title: "Selected Task" });
            } else if (action === "toggle-status" && taskId) {
                alert("Task status toggling will be connected to the backend API in Phase 2B.");
            }
        });
    }

    // ========================================================
    // 9. Initial Render & Clean Integration API
    // ========================================================
    renderTaskView();

    // Expose programmatic test and Phase 2B integration interface
    window.FlowTask = {
        getTasks: function () {
            return tasks;
        },
        setTasks: function (newTasks) {
            tasks = Array.isArray(newTasks) ? newTasks : [];
            renderTaskView();
            updateStatistics();
        },
        setFilter: setFilter,
        openTaskModal: openTaskModal,
        closeTaskModal: closeTaskModal,
        openDeleteModal: openDeleteModal,
        closeDeleteModal: closeDeleteModal,
        renderLoadingState: renderLoadingState,
        renderErrorState: renderErrorState,
        renderDisconnectedState: renderDisconnectedState,
        renderTaskView: renderTaskView
    };

});
