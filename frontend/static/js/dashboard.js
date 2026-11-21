/**
 * FlowTask - Dashboard & Task Management (Phase 2B Step 3)
 * Manages live task data fetching, Add/Edit task persistence via REST API,
 * status toggling, deletion confirmation, filtering, statistics, and auth guard.
 */

document.addEventListener("DOMContentLoaded", function () {
  // ========================================================
  // 0. Authentication Guard & User Profile
  // ========================================================
  const auth = window.FlowAuth;
  if (!window.__FLOWTASK_DISABLE_AUTH_GUARD__) {
    if (!auth || !auth.isAuthenticated()) {
      if (window.location && window.location.replace) {
        window.location.replace("/login");
      }
      return;
    }
  }

  // Populate user profile in header if authenticated
  if (auth && auth.isAuthenticated()) {
    const currentUser = auth.getUser();
    if (currentUser) {
      const userNameEl = document.getElementById("user-name");
      const welcomeNameEl = document.getElementById("welcome-name");
      const avatarEl = document.querySelector(".profile-avatar");
      const roleDisplayEl = document.getElementById("user-role-display");
      const adminLinkEl = document.getElementById("nav-admin-link");
      const displayName = currentUser.name || "User";

      if (userNameEl) userNameEl.textContent = displayName;
      if (welcomeNameEl) welcomeNameEl.textContent = displayName;
      if (avatarEl) avatarEl.textContent = displayName.charAt(0).toUpperCase();

      if (currentUser.role === "admin") {
        if (roleDisplayEl) roleDisplayEl.textContent = "Administrator";
        if (adminLinkEl) adminLinkEl.hidden = false;
      }
    }
  }

  // Wire Logout Handlers
  const logoutElements = document.querySelectorAll(
    ".nav-item-logout, .header-action-logout, #sidebar-logout, #mobile-logout",
  );
  logoutElements.forEach(function (el) {
    el.addEventListener("click", function (event) {
      event.preventDefault();
      if (window.FlowAuth) {
        window.FlowAuth.logout("/login");
      } else {
        try {
          localStorage.removeItem("flowtask_token");
          localStorage.removeItem("flowtask_user");
        } catch (e) {}
        window.location.href = "/login";
      }
    });
  });

  // ========================================================
  // 1. In-Memory State & API Helpers
  // ========================================================
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
  const navDashboard = document.getElementById("nav-dashboard");

  // DOM Elements - Statistics
  const totalTasksEl = document.getElementById("total-tasks");
  const pendingTasksEl = document.getElementById("pending-tasks");
  const completedTasksEl = document.getElementById("completed-tasks");

  // DOM Elements - Task Container
  const taskContainer = document.getElementById("task-container");
  // DOM Elements - Search & Sort
  const taskSearchInput = document.getElementById("task-search-input");
  const taskSortSelect = document.getElementById("task-sort-select");

  // DOM Elements - Add/Edit Task Modal
  const taskModal = document.getElementById("task-modal");
  const taskForm = document.getElementById("task-form");
  const taskModalEyebrow = document.getElementById("task-modal-eyebrow");
  const taskModalTitle = document.getElementById("task-modal-title");
  const taskModalSubtitle = document.getElementById("task-modal-subtitle");
  const taskTitleInput = document.getElementById("task-title");
  const taskDescInput = document.getElementById("task-description");
  const taskPriorityInput = document.getElementById("task-priority");
  const taskCategoryInput = document.getElementById("task-category");
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

  /**
   * Authenticated API request helper.
   * Attaches JWT Bearer token and redirects to /login on 401 Unauthorized.
   */
  async function apiRequest(endpoint, options = {}) {
    const token = window.FlowAuth ? window.FlowAuth.getToken() : null;
    const headers = {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    };

    const response = await fetch(endpoint, {
      ...options,
      headers: headers,
    });

    if (response.status === 401) {
      if (window.FlowAuth) {
        window.FlowAuth.logout("/login");
      } else {
        try {
          localStorage.removeItem("flowtask_token");
          localStorage.removeItem("flowtask_user");
        } catch (e) {}
        if (window.location && window.location.replace) {
          window.location.replace("/login");
        }
      }
      throw new Error("Unauthorized - session expired");
    }

    return response;
  }

  // ========================================================
  // 2. Date & Formatting Helpers
  // ========================================================
  if (dateElement) {
    const today = new Date();
    dateElement.textContent = today.toLocaleDateString("en-IN", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }

  function formatDisplayDate(dateStr) {
    if (!dateStr) return "No due date";
    try {
      const dateObj = new Date(
        dateStr.length === 10 ? `${dateStr}T12:00:00` : dateStr,
      );
      if (isNaN(dateObj.getTime())) return dateStr;
      return dateObj.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
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
        "'": "&#39;",
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
    const isCompleted =
      String(task.status || "pending").toLowerCase() === "completed";
    const priority = String(task.priority || "medium").toLowerCase();
    const priorityClass = `priority-${priority}`;
    const statusClass = isCompleted ? "badge-success" : "badge-warning";
    const statusLabel = isCompleted ? "Completed" : "Pending";
    const formattedDate = formatDisplayDate(task.due_date);

    return `
            <article class="task-card ${isCompleted ? "is-completed" : ""}" data-task-id="${escapeHtml(String(task.id))}">
                <div class="task-card-header">
                    <span class="badge ${statusClass}">${escapeHtml(statusLabel)}</span>
                    <span class="priority-badge ${priorityClass}">${escapeHtml(capitalize(priority))} Priority</span>
                </div>
                <h3 class="task-card-title">${escapeHtml(task.title)}</h3>
                <p class="task-card-desc">${escapeHtml(task.description || "No description provided.")}</p>
                <div class="task-card-meta">
                    <span class="due-date">📅 Due ${escapeHtml(formattedDate)}</span>
                    ${task.category ? `<span class="badge-category" title="Category: ${escapeHtml(task.category)}">🏷️ ${escapeHtml(task.category)}</span>` : ""}
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

    // If no tasks exist in memory, show the context-specific empty state
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
                                Plan your day, organize your schedule, and track progress right from this dashboard.
                            </p>
                            <button class="btn btn-primary" id="empty-add-task-btn" data-action="add-task" type="button">
                                + Create Your First Task
                            </button>
                        </div>
                    </div>
                `;
      }
      updateStatistics();
      return;
    }

    // Filter tasks when data is available (Status + Search)
    const searchTerm = taskSearchInput
      ? taskSearchInput.value.trim().toLowerCase()
      : "";

    let filteredTasks = tasks.filter(function (t) {
      const status = String(t.status || "pending").toLowerCase();

      // Status filter
      if (currentFilter === "pending" && status !== "pending") return false;
      if (currentFilter === "completed" && status !== "completed") return false;

      // Search by task title
      const title = String(t.title || "").toLowerCase();
      if (searchTerm && !title.includes(searchTerm)) return false;

      return true;
    });

    // Sort tasks
    const sortOption = taskSortSelect ? taskSortSelect.value : "default";

    if (sortOption === "due-date") {
      filteredTasks.sort(function (a, b) {
        // Tasks without due dates should appear last
        const dateA = a.due_date
          ? String(a.due_date).substring(0, 10)
          : "9999-12-31";
        const dateB = b.due_date
          ? String(b.due_date).substring(0, 10)
          : "9999-12-31";

        return dateA.localeCompare(dateB);
      });
    } else if (sortOption === "priority") {
      const priorityOrder = {
        high: 1,
        medium: 2,
        low: 3,
      };

      filteredTasks.sort(function (a, b) {
        const priorityA =
          priorityOrder[String(a.priority || "medium").toLowerCase()] || 2;
        const priorityB =
          priorityOrder[String(b.priority || "medium").toLowerCase()] || 2;

        return priorityA - priorityB;
      });
    }

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
                    <p class="muted">${escapeHtml(errorMessage || "A connection error occurred while loading your tasks.")}</p>
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
  // 5. Live Backend Data Fetching
  // ========================================================
  async function fetchTasks() {
    renderLoadingState();
    try {
      const response = await apiRequest("/api/tasks", { method: "GET" });
      if (!response.ok) {
        let errorData = {};
        try {
          errorData = await response.json();
        } catch (e) {}
        renderErrorState(
          errorData.error || "Unable to load tasks from server.",
        );
        return;
      }

      const data = await response.json();
      tasks = Array.isArray(data) ? data : [];
      renderTaskView();
      updateStatistics();
    } catch (err) {
      if (err.message && err.message.includes("Unauthorized")) {
        return; // Handled by apiRequest redirect
      }
      renderErrorState(
        "Unable to connect to task service. Please check your network connection.",
      );
    }
  }

  // ========================================================
  // 6. Filter Handling
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

  // Search tasks live as the user types
  if (taskSearchInput) {
    taskSearchInput.addEventListener("input", function () {
      renderTaskView();
    });
  }

  // Sort tasks when the sort option changes
  if (taskSortSelect) {
    taskSortSelect.addEventListener("change", function () {
      renderTaskView();
    });
  }

  function setSidebarActive(activeLink) {
    const sidebarLinks = [navDashboard, navMyTasks, navCompleted];

    sidebarLinks.forEach(function (link) {
      if (!link) return;

      const isActive = link === activeLink;

      link.classList.toggle("active", isActive);
      link.classList.toggle("is-active", isActive);

      if (isActive) {
        link.setAttribute("aria-current", "page");
      } else {
        link.removeAttribute("aria-current");
      }
    });
  }

  filterButtons.forEach(function (button) {
    button.addEventListener("click", function () {
      setFilter(button.dataset.filter);
    });
  });
  if (navDashboard) {
    navDashboard.addEventListener("click", function (event) {
      event.preventDefault();
      setFilter("all");
      setSidebarActive(navDashboard);
    });
  }
  if (navMyTasks) {
    navMyTasks.addEventListener("click", function (event) {
      event.preventDefault();
      setFilter("all");
      setSidebarActive(navMyTasks);
    });
  }

  if (navCompleted) {
    navCompleted.addEventListener("click", function (event) {
      event.preventDefault();
      setFilter("completed");
      setSidebarActive(navCompleted);
    });
  }

  // ========================================================
  // 7. Add & Edit Task Modal
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
      taskModalFeedback.className = "auth-feedback";
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
      if (taskModalSubtitle)
        taskModalSubtitle.textContent = "Update task details.";
      if (saveTaskBtn) saveTaskBtn.textContent = "Save Changes";

      if (taskTitleInput) taskTitleInput.value = task.title || "";
      if (taskDescInput) taskDescInput.value = task.description || "";
      if (taskPriorityInput)
        taskPriorityInput.value = (task.priority || "medium").toLowerCase();
      if (taskCategoryInput) taskCategoryInput.value = task.category || "";
      if (taskDateInput)
        taskDateInput.value = task.due_date
          ? String(task.due_date).substring(0, 10)
          : "";
    } else {
      activeEditingTaskId = null;
      if (taskModalEyebrow) taskModalEyebrow.textContent = "TASK DETAILS";
      if (taskModalTitle) taskModalTitle.textContent = "Add Task";
      if (taskModalSubtitle)
        taskModalSubtitle.textContent = "Fill in the details of your task.";
      if (saveTaskBtn) saveTaskBtn.textContent = "Save Task";

      if (taskForm) taskForm.reset();
      if (taskCategoryInput) taskCategoryInput.value = "";
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

  // Form Submission & Validation with live API integration
  if (taskForm) {
    taskForm.addEventListener("submit", async function (event) {
      event.preventDefault();
      clearModalErrors();

      const title = taskTitleInput ? taskTitleInput.value.trim() : "";
      const dueDate = taskDateInput ? taskDateInput.value : "";
      const description = taskDescInput ? taskDescInput.value.trim() : "";
      const priority = taskPriorityInput ? taskPriorityInput.value : "medium";
      const category = taskCategoryInput ? taskCategoryInput.value.trim() : "";

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
      if (dueDate) {
        const today = new Date();
        const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

        if (dueDate < todayStr) {
          const dateError = document.getElementById("task-date-error");
          if (dateError)
            dateError.textContent = "Due date cannot be in the past.";
          if (taskDateInput) taskDateInput.setAttribute("aria-invalid", "true");
          isValid = false;
          if (!firstInvalid) firstInvalid = taskDateInput;
        }
      }
      if (!isValid) {
        if (firstInvalid) firstInvalid.focus();
        return;
      }

      // Prepare payload
      const payload = {
        title: title,
        description: description,
        priority: priority,
        due_date: dueDate,
        category: category,
      };

      const originalBtnText = saveTaskBtn
        ? saveTaskBtn.textContent
        : "Save Task";
      if (saveTaskBtn) {
        saveTaskBtn.disabled = true;
        saveTaskBtn.textContent = activeEditingTaskId
          ? "Saving changes..."
          : "Saving task...";
      }

      try {
        if (activeEditingTaskId) {
          // Update existing task via PUT
          const response = await apiRequest(
            `/api/tasks/${activeEditingTaskId}`,
            {
              method: "PUT",
              body: JSON.stringify(payload),
            },
          );

          if (response.ok) {
            const updatedTask = await response.json();
            const idx = tasks.findIndex(function (t) {
              return String(t.id) === String(activeEditingTaskId);
            });
            if (idx !== -1) {
              tasks[idx] = updatedTask;
            }
            closeTaskModal();
            renderTaskView();
            updateStatistics();
          } else {
            const errData = await response.json().catch(function () {
              return {};
            });
            if (taskModalFeedback) {
              taskModalFeedback.hidden = false;
              taskModalFeedback.className = "auth-feedback feedback-error";
              taskModalFeedback.textContent =
                errData.error || "Failed to update task. Please try again.";
            }
          }
        } else {
          // Create new task via POST
          const response = await apiRequest("/api/tasks", {
            method: "POST",
            body: JSON.stringify(payload),
          });

          if (response.status === 201) {
            const newTask = await response.json();
            tasks.unshift(newTask);
            closeTaskModal();
            renderTaskView();
            updateStatistics();
          } else {
            const errData = await response.json().catch(function () {
              return {};
            });
            if (taskModalFeedback) {
              taskModalFeedback.hidden = false;
              taskModalFeedback.className = "auth-feedback feedback-error";
              taskModalFeedback.textContent =
                errData.error || "Failed to create task. Please try again.";
            }
          }
        }
      } catch (err) {
        if (err.message && err.message.includes("Unauthorized")) {
          return; // Handled by apiRequest redirect
        }
        if (taskModalFeedback) {
          taskModalFeedback.hidden = false;
          taskModalFeedback.className = "auth-feedback feedback-error";
          taskModalFeedback.textContent =
            "Network error: Unable to save task. Please check your connection.";
        }
      } finally {
        if (saveTaskBtn) {
          saveTaskBtn.disabled = false;
          saveTaskBtn.textContent = originalBtnText;
        }
      }
    });
  }

  // ========================================================
  // 8. Delete Confirmation Modal
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
        deleteTaskTarget.textContent =
          "Are you sure you want to delete this task? All task details will be permanently removed.";
      }
    }

    if (deleteModalFeedback) {
      deleteModalFeedback.hidden = true;
      deleteModalFeedback.textContent = "";
      deleteModalFeedback.className = "auth-feedback";
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
      deleteModalFeedback.className = "auth-feedback";
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
    confirmDeleteBtn.addEventListener("click", async function () {
      if (!activeDeletingTaskId) return;

      confirmDeleteBtn.disabled = true;
      confirmDeleteBtn.textContent = "Deleting...";

      try {
        const response = await apiRequest(
          `/api/tasks/${activeDeletingTaskId}`,
          {
            method: "DELETE",
          },
        );

        if (response.ok) {
          tasks = tasks.filter(function (t) {
            return String(t.id) !== String(activeDeletingTaskId);
          });
          closeDeleteModal();
          renderTaskView();
          updateStatistics();
        } else {
          const errData = await response.json().catch(function () {
            return {};
          });
          if (deleteModalFeedback) {
            deleteModalFeedback.hidden = false;
            deleteModalFeedback.className = "auth-feedback feedback-error";
            deleteModalFeedback.textContent =
              errData.error || "Failed to delete task.";
          }
          confirmDeleteBtn.disabled = false;
          confirmDeleteBtn.textContent = "Confirm Delete";
        }
      } catch (err) {
        if (err.message && err.message.includes("Unauthorized")) {
          return; // Handled by apiRequest redirect
        }
        if (deleteModalFeedback) {
          deleteModalFeedback.hidden = false;
          deleteModalFeedback.className = "auth-feedback feedback-error";
          deleteModalFeedback.textContent =
            "Network error: Unable to delete task. Please check your connection.";
        }
        confirmDeleteBtn.disabled = false;
        confirmDeleteBtn.textContent = "Confirm Delete";
      }
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
  // 9. Event Delegation on Task Container
  // ========================================================
  if (taskContainer) {
    taskContainer.addEventListener("click", async function (event) {
      const target = event.target.closest("button");
      if (!target) return;

      const action = target.dataset.action;
      const taskId = target.dataset.taskId;

      if (action === "add-task" || target.id === "empty-add-task-btn") {
        openTaskModal("add");
      } else if (action === "filter-all") {
        setFilter("all");
      } else if (action === "retry-tasks") {
        fetchTasks();
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
        const task = tasks.find(function (t) {
          return String(t.id) === String(taskId);
        });
        if (!task) return;

        const currentStatus = String(task.status || "pending").toLowerCase();
        const newStatus =
          currentStatus === "completed" ? "pending" : "completed";
        const originalText = target.textContent;

        target.disabled = true;
        target.textContent = "...";

        try {
          const response = await apiRequest(`/api/tasks/${taskId}`, {
            method: "PUT",
            body: JSON.stringify({ status: newStatus }),
          });

          if (response.ok) {
            const updated = await response.json();
            task.status = updated.status || newStatus;
            renderTaskView();
            updateStatistics();
          } else {
            const errData = await response.json().catch(function () {
              return {};
            });
            alert(errData.error || "Failed to update task status.");
            target.disabled = false;
            target.textContent = originalText;
          }
        } catch (err) {
          if (!err.message || !err.message.includes("Unauthorized")) {
            alert("Network error: Unable to update task status.");
            target.disabled = false;
            target.textContent = originalText;
          }
        }
      }
    });
  }

  // ========================================================
  // 10. Initial Live Data Load & Public Interface
  // ========================================================
  // If auth guard was bypassed for testing, only fetch if authenticated
  if (
    !window.__FLOWTASK_DISABLE_AUTH_GUARD__ ||
    (auth && auth.isAuthenticated())
  ) {
    fetchTasks();
  } else {
    renderTaskView();
  }

  // Expose programmatic test and integration interface
  window.FlowTask = {
    getTasks: function () {
      return tasks;
    },
    setTasks: function (newTasks) {
      tasks = Array.isArray(newTasks) ? newTasks : [];
      renderTaskView();
      updateStatistics();
    },
    fetchTasks: fetchTasks,
    setFilter: setFilter,
    openTaskModal: openTaskModal,
    closeTaskModal: closeTaskModal,
    openDeleteModal: openDeleteModal,
    closeDeleteModal: closeDeleteModal,
    renderLoadingState: renderLoadingState,
    renderErrorState: renderErrorState,
    renderDisconnectedState: renderDisconnectedState,
    renderTaskView: renderTaskView,
  };
});
