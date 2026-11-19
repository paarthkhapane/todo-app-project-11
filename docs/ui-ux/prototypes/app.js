const app = document.querySelector("#app");
const authTemplate = document.querySelector("#auth-template");
const dashboardTemplate = document.querySelector("#dashboard-template");
const taskModal = document.querySelector("#task-modal");
const deleteModal = document.querySelector("#delete-modal");
const toast = document.querySelector("#toast");

let authMode = "login";
let role = "user";
let activePage = "Overview";
let taskFilter = "All";
let editingTaskId = null;
let deletingTaskId = null;
let adminTaskFilterValue = "All";
let lastFocusedElement = null;

const demoTasks = [
  { id: 1, title: "Prepare UI review", description: "Review responsive states and component consistency.", priority: "High", due: "2026-11-22", status: "Pending", owner: "Om Vithoba" },
  { id: 2, title: "Document add task flow", description: "Include validation and success feedback.", priority: "Medium", due: "2026-11-24", status: "Completed", owner: "Om Vithoba" },
  { id: 3, title: "Review mobile navigation", description: "Check navigation labels and bottom spacing.", priority: "Low", due: "2026-11-28", status: "Pending", owner: "Om Vithoba" }
];

const demoUsers = [
  { name: "Om Vithoba Veturekar", email: "om@example.test", role: "User", status: "Active", date: "2026-11-10" },
  { name: "Abhijeet Sawant", email: "abhijeet@example.test", role: "User", status: "Active", date: "2026-11-11" },
  { name: "Mayur Gacche", email: "mayur@example.test", role: "Admin", status: "Active", date: "2026-11-12" }
];

function renderAuth(mode = "login") {
  authMode = mode;
  app.replaceChildren(authTemplate.content.cloneNode(true));

  const isRegistration = mode === "register";
  document.querySelector("#auth-eyebrow").textContent = isRegistration ? "CREATE ACCOUNT" : "WELCOME BACK";
  document.querySelector("#auth-title").textContent = isRegistration ? "Create your account" : "Login to FlowTask";
  document.querySelector("#auth-subtitle").textContent = isRegistration
    ? "Public registration creates an illustrative normal User account."
    : "Enter your details to open the demo dashboard.";
  document.querySelector("#name-field").hidden = !isRegistration;
  document.querySelector("#confirm-field").hidden = !isRegistration;
  document.querySelector("#login-options").hidden = isRegistration;
  document.querySelector("#auth-submit").textContent = isRegistration ? "Create Account" : "Log In";
  document.querySelector("#auth-switch-copy").textContent = isRegistration ? "Already have an account?" : "New to FlowTask?";
  document.querySelector("#auth-switch").textContent = isRegistration ? "Log in" : "Create an account";

}

function togglePassword(button) {
  const input = document.querySelector(`#${button.dataset.passwordToggle}`);
  const show = input.type === "password";
  input.type = show ? "text" : "password";
  button.textContent = show ? "Hide" : "Show";
}

function handleAuthSubmit(event) {
  event.preventDefault();

  const email = document.querySelector("#email");
  const password = document.querySelector("#password");
  const confirmPassword = document.querySelector("#confirm-password");
  const fullName = document.querySelector("#full-name");
  const nameError = document.querySelector("#name-error");
  const emailError = document.querySelector("#email-error");
  const passwordError = document.querySelector("#password-error");
  const confirmError = document.querySelector("#confirm-error");
  let valid = true;

  emailError.textContent = "";
  passwordError.textContent = "";
  confirmError.textContent = "";
  nameError.textContent = "";
  email.setAttribute("aria-invalid", "false");
  password.setAttribute("aria-invalid", "false");

  if (authMode === "register" && !fullName.value.trim()) {
    nameError.textContent = "Enter your full name.";
    fullName.setAttribute("aria-invalid", "true");
    valid = false;
  } else if (authMode === "register") {
    fullName.setAttribute("aria-invalid", "false");
  }

  if (!email.value.trim() || !email.validity.valid) {
    emailError.textContent = "Enter a valid email address.";
    email.setAttribute("aria-invalid", "true");
    valid = false;
  }
  if (password.value.length < 8) {
    passwordError.textContent = "Password must contain at least 8 characters.";
    password.setAttribute("aria-invalid", "true");
    valid = false;
  }
  if (authMode === "register" && confirmPassword.value !== password.value) {
    confirmError.textContent = "Passwords do not match.";
    confirmPassword.setAttribute("aria-invalid", "true");
    valid = false;
  } else if (authMode === "register") {
    confirmPassword.setAttribute("aria-invalid", "false");
  }

  if (valid) {
    openDashboard("user");
  }
}

function openDashboard(selectedRole) {
  role = selectedRole;
  activePage = selectedRole === "admin" ? "Admin Overview" : "Overview";
  taskFilter = "All";
  app.replaceChildren(dashboardTemplate.content.cloneNode(true));

  const isAdmin = role === "admin";
  document.querySelector("#profile-name").textContent = isAdmin ? "Mayur Gacche" : "Om Vithoba";
  document.querySelector("#profile-role").textContent = isAdmin ? "Illustrative Admin" : "Illustrative User";
  document.querySelector(".profile-avatar").textContent = isAdmin ? "MG" : "OV";
  renderNavigation();
  renderPage();
}

function renderNavigation() {
  const nav = document.querySelector("#sidebar-nav");
  const items = role === "admin"
    ? [
        ["Admin Overview", "grid"],
        ["Manage Users", "users"],
        ["All Tasks", "tasks"],
        ["Task Statistics", "chart"],
        ["Logout", "logout"]
      ]
    : [
        ["Overview", "grid"],
        ["My Tasks", "tasks"],
        ["Add Task", "add"],
        ["Pending Tasks", "clock"],
        ["Completed Tasks", "check"],
        ["Logout", "logout"]
      ];

  nav.replaceChildren();
  items.forEach(([label]) => {
    const link = document.createElement("button");
    link.type = "button";
    link.className = `nav-item${label === activePage ? " is-active" : ""}`;
    link.dataset.navPage = label;
    link.dataset.mobileLabel = mobileNavigationLabel(label);
    link.setAttribute("aria-label", label);
    link.setAttribute("aria-current", label === activePage ? "page" : "false");
    link.innerHTML = `<span aria-hidden="true">•</span><span class="nav-item-label">${label}</span>`;
    nav.appendChild(link);
  });
}

function mobileNavigationLabel(label) {
  const labels = {
    "Admin Overview": "Home",
    "Manage Users": "Users",
    "All Tasks": "Tasks",
    "Task Statistics": "Stats",
    Overview: "Home",
    "My Tasks": "Tasks",
    "Add Task": "Add",
    "Pending Tasks": "Pending",
    "Completed Tasks": "Done",
    Logout: "Exit"
  };
  return labels[label];
}

function handleNavigation(label) {
  if (label === "Logout") {
    renderAuth("login");
    showToast("Illustrative prototype signed out.");
    return;
  }
  if (label === "Add Task") {
    openTaskModal();
    return;
  }

  activePage = label;
  taskFilter = label === "Pending Tasks" ? "Pending" : label === "Completed Tasks" ? "Completed" : "All";
  renderNavigation();
  renderPage();
}

function renderPage() {
  if (role === "admin") {
    renderAdminPage();
  } else if (activePage === "My Tasks" || activePage === "Pending Tasks" || activePage === "Completed Tasks") {
    renderTaskList();
  } else {
    renderUserOverview();
  }
}

function renderUserOverview() {
  document.querySelector("#header-eyebrow").textContent = "USER OVERVIEW";
  document.querySelector("#header-title").textContent = "Good morning, Om";
  const pending = demoTasks.filter((task) => task.status === "Pending").length;
  const completed = demoTasks.filter((task) => task.status === "Completed").length;

  document.querySelector("#dashboard-content").innerHTML = `
    <section class="stats-grid" aria-label="Illustrative task statistics">
      ${statCard("Total Tasks", demoTasks.length)}
      ${statCard("Pending Tasks", pending)}
      ${statCard("Completed Tasks", completed)}
    </section>
    <section class="section-heading">
      <div><p class="eyebrow">MY WORK</p><h2>My Tasks</h2></div>
      <button class="btn btn-primary" type="button" id="overview-add">+ Add Task</button>
    </section>
    ${taskGrid(getFilteredTasks("All"))}
  `;
}

function statCard(label, value) {
  return `<article class="stat-card"><span class="stat-card-label">${label}</span><strong class="stat-card-value">${value}</strong></article>`;
}

function renderTaskList() {
  const title = activePage === "Pending Tasks" ? "Pending Tasks" : activePage === "Completed Tasks" ? "Completed Tasks" : "My Tasks";
  document.querySelector("#header-eyebrow").textContent = "TASKS";
  document.querySelector("#header-title").textContent = title;
  document.querySelector("#dashboard-content").innerHTML = `
    <section class="section-heading">
      <div><p class="eyebrow">ILLUSTATIVE DEMO</p><h2>${title}</h2></div>
      <button class="btn btn-primary" type="button" id="list-add">+ Add Task</button>
    </section>
    <div class="filter-tabs" role="tablist" aria-label="Task status filters">
      ${filterButton("All")}
      ${filterButton("Pending")}
      ${filterButton("Completed")}
    </div>
    <div class="prototype-filter-gap"></div>
    ${taskGrid(getFilteredTasks(taskFilter))}
  `;
}

function filterButton(label) {
  return `<button class="filter-tab${taskFilter === label ? " is-active" : ""}" type="button" role="tab" aria-selected="${taskFilter === label}" data-task-filter="${label}">${label}</button>`;
}

function getFilteredTasks(filter) {
  if (filter === "All") return demoTasks;
  return demoTasks.filter((task) => task.status === filter);
}

function taskGrid(tasks) {
  if (!tasks.length) {
    return `<div class="empty-state"><div><h2>No tasks in this view</h2><p class="muted">Add a task or change the filter.</p></div></div>`;
  }
  return `<section class="task-grid">${tasks.map(taskCard).join("")}</section>`;
}

function taskCard(task) {
  const priorityClass = `priority-${task.priority.toLowerCase()}`;
  const statusClass = task.status === "Completed" ? "badge-success" : "badge-warning";
  return `
    <article class="task-card${task.status === "Completed" ? " is-completed" : ""}">
      <div class="task-status-row">
        <span class="badge ${statusClass}">${task.status}</span>
        <span class="priority-badge ${priorityClass}">${task.priority} priority</span>
      </div>
      <h3>${escapeHtml(task.title)}</h3>
      <p>${escapeHtml(task.description)}</p>
      <div class="task-card-meta">
        <span class="due-date">Due ${formatDate(task.due)}</span>
      </div>
      <div class="task-card-actions">
        ${task.status === "Pending" ? `<button class="btn btn-secondary" type="button" data-complete="${task.id}">Mark Complete</button>` : ""}
        <button class="btn btn-secondary" type="button" data-edit="${task.id}">Edit</button>
        <button class="btn btn-secondary" type="button" data-delete="${task.id}">Delete</button>
      </div>
    </article>
  `;
}

function openTaskModal(taskId = null) {
  editingTaskId = taskId;
  const task = taskId ? demoTasks.find((item) => item.id === taskId) : null;
  if (taskId && !task) {
    showToast("That illustrative task is no longer available.");
    return;
  }
  document.querySelector("#task-modal-title").textContent = task ? "Edit Task" : "Add a task";
  document.querySelector("#task-save").textContent = task ? "Save Changes" : "Save Task";
  document.querySelector("#task-title").value = task ? task.title : "";
  document.querySelector("#task-description").value = task ? task.description : "";
  document.querySelector("#task-priority").value = task ? task.priority : "Medium";
  document.querySelector("#task-due").value = task ? task.due : "";
  document.querySelector("#task-title").setAttribute("aria-invalid", "false");
  document.querySelector("#task-error").textContent = "";
  openModal(taskModal, document.querySelector("#task-title"));
}

function openDeleteModal(taskId) {
  const task = demoTasks.find((item) => item.id === taskId);
  if (!task) {
    showToast("That illustrative task is no longer available.");
    return;
  }
  deletingTaskId = taskId;
  document.querySelector("#delete-copy").textContent = `Illustrative task: "${task.title}". This action cannot be undone.`;
  openModal(deleteModal, document.querySelector("#confirm-delete"));
}

function renderAdminPage() {
  document.querySelector("#header-eyebrow").textContent = "ADMIN";
  document.querySelector("#header-title").textContent = activePage;

  if (activePage === "Manage Users") {
    renderAdminUsers();
  } else if (activePage === "All Tasks") {
    renderAdminTasks();
  } else if (activePage === "Task Statistics") {
    renderAdminStatistics();
  } else {
    document.querySelector("#dashboard-content").innerHTML = `
      <section class="stats-grid admin-stats" aria-label="Illustrative admin statistics">
        ${statCard("Registered Users", demoUsers.length)}
        ${statCard("Total Tasks", demoTasks.length)}
        ${statCard("Pending Tasks", demoTasks.filter((task) => task.status === "Pending").length)}
        ${statCard("Completed Tasks", demoTasks.filter((task) => task.status === "Completed").length)}
      </section>
      <section class="section-heading"><div><p class="eyebrow">ILLUSTATIVE DEMO</p><h2>Recent tasks</h2></div></section>
      ${adminTaskTable(demoTasks)}
    `;
  }
}

function renderAdminUsers() {
  document.querySelector("#dashboard-content").innerHTML = `
    <section class="section-heading">
      <div><p class="eyebrow">ILLUSTATIVE DEMO</p><h2>Manage Users</h2></div>
    </section>
    <div class="search-row">
      <input class="input search-input" id="user-search" type="search" placeholder="Search illustrative users" aria-label="Search users">
      <select class="select" id="user-role-filter" aria-label="Filter users by role">
        <option value="All">All Roles</option><option value="User">User</option><option value="Admin">Admin</option>
      </select>
    </div>
    <div class="table-wrap">
      <table class="data-table">
        <thead><tr><th>User Name</th><th>Email</th><th>Role</th><th>Status</th><th>Registered</th><th>Actions</th></tr></thead>
        <tbody id="user-table-body">${demoUserRows(demoUsers)}</tbody>
      </table>
    </div>
  `;
}

function demoUserRows(users) {
  if (!users.length) return `<tr><td colspan="6">No illustrative users match this filter.</td></tr>`;
  return users.map((user) => `
    <tr>
      <td><div class="admin-user"><span class="profile-avatar">${initials(user.name)}</span><strong>${escapeHtml(user.name)}</strong></div></td>
      <td>${escapeHtml(user.email)}</td>
      <td><span class="badge ${user.role === "Admin" ? "badge-info" : "badge-success"}">${user.role}</span></td>
      <td><span class="badge badge-success">${user.status}</span></td>
      <td>${formatDate(user.date)}</td>
      <td><button class="btn btn-secondary" type="button" data-user-action="${escapeHtml(user.name)}">View</button></td>
    </tr>
  `).join("");
}

function renderAdminTasks() {
  adminTaskFilterValue = "All";
  document.querySelector("#dashboard-content").innerHTML = `
    <section class="section-heading"><div><p class="eyebrow">ILLUSTATIVE DEMO</p><h2>All Tasks</h2></div></section>
    <div class="toolbar">
      <input class="input search-input" id="task-search" type="search" placeholder="Search illustrative tasks" aria-label="Search tasks">
      <div class="filter-tabs" role="tablist" aria-label="Task status filters">
        ${adminTaskFilter("All")}
        ${adminTaskFilter("Pending")}
        ${adminTaskFilter("Completed")}
      </div>
    </div>
    <div id="admin-task-results">${adminTaskTable(demoTasks)}</div>
  `;

}

function adminTaskFilter(label) {
  return `<button class="filter-tab${adminTaskFilterValue === label ? " is-active" : ""}" type="button" role="tab" aria-selected="${adminTaskFilterValue === label}" data-admin-task-filter="${label}">${label}</button>`;
}

function adminTaskTable(tasks) {
  if (!tasks.length) {
    return `<div class="empty-state"><div><h2>No illustrative tasks</h2><p class="muted">No task matches the current view.</p></div></div>`;
  }
  return `<div class="table-wrap"><table class="data-table"><thead><tr><th>Task Title</th><th>Owner</th><th>Priority</th><th>Due Date</th><th>Status</th></tr></thead><tbody>
    ${tasks.map((task) => `<tr>
      <td><strong>${escapeHtml(task.title)}</strong><div class="owner">${escapeHtml(task.description)}</div></td>
      <td>${escapeHtml(task.owner)}</td>
      <td><span class="priority-badge priority-${task.priority.toLowerCase()}">${task.priority}</span></td>
      <td>${formatDate(task.due)}</td>
      <td><span class="badge ${task.status === "Completed" ? "badge-success" : "badge-warning"}">${task.status}</span></td>
    </tr>`).join("")}
  </tbody></table></div>`;
}

function renderAdminStatistics() {
  const total = demoTasks.length;
  const pending = demoTasks.filter((task) => task.status === "Pending").length;
  const completed = demoTasks.filter((task) => task.status === "Completed").length;
  const percentage = total ? Math.round((completed / total) * 100) : 0;
  document.querySelector("#dashboard-content").innerHTML = `
    <section class="stats-grid admin-stats" aria-label="Illustrative task statistics">
      ${statCard("Total Tasks", total)}
      ${statCard("Pending Tasks", pending)}
      ${statCard("Completed Tasks", completed)}
      ${statCard("Completion", `${percentage}%`)}
    </section>
    <section class="analytics-grid">
      <article class="card chart-card">
        <p class="eyebrow">ILLUSTATIVE DEMO</p><h2>Task Status</h2>
        <div class="chart-bars">
          <div class="chart-bar" style="height:${total ? 100 : 12}% " data-label="Total ${total}"></div>
          <div class="chart-bar pending" style="height:${total ? pending / total * 100 : 12}% " data-label="Pending ${pending}"></div>
          <div class="chart-bar completed" style="height:${total ? completed / total * 100 : 12}% " data-label="Completed ${completed}"></div>
        </div>
      </article>
      <article class="card">
        <p class="eyebrow">COMPLETION</p><h2>${percentage}% complete</h2>
        <div class="chart-total"><div><strong class="stat-card-value">${percentage}%</strong><span class="muted small">Illustrative</span></div></div>
        <div class="progress" aria-label="${percentage}% illustrative completion"><div class="progress-bar" style="width:${percentage}%"></div></div>
      </article>
    </section>
  `;
}

function openModal(modal, focusTarget) {
  closeModal(taskModal, false);
  closeModal(deleteModal, false);
  lastFocusedElement = document.activeElement;
  modal.hidden = false;
  focusTarget.focus();
}

function closeModal(modal, restoreFocus = true) {
  if (modal.hidden) return;
  modal.hidden = true;
  if (modal === taskModal) {
    editingTaskId = null;
  } else if (modal === deleteModal) {
    deletingTaskId = null;
  }
  if (restoreFocus && lastFocusedElement && lastFocusedElement.isConnected) {
    lastFocusedElement.focus();
  }
}

function closeOpenModal() {
  if (!taskModal.hidden) {
    closeModal(taskModal);
  } else if (!deleteModal.hidden) {
    closeModal(deleteModal);
  }
}

app.addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (!button) return;

  if (button.dataset.navPage) {
    handleNavigation(button.dataset.navPage);
  } else if (button.dataset.loginRole) {
    openDashboard(button.dataset.loginRole);
  } else if (button.id === "auth-switch") {
    renderAuth(authMode === "register" ? "login" : "register");
  } else if (button.dataset.passwordToggle) {
    togglePassword(button);
  } else if (button.id === "overview-add" || button.id === "list-add") {
    openTaskModal();
  } else if (button.dataset.taskFilter) {
    taskFilter = button.dataset.taskFilter;
    renderTaskList();
  } else if (button.dataset.adminTaskFilter) {
    adminTaskFilterValue = button.dataset.adminTaskFilter;
    updateAdminTaskResults();
    document.querySelectorAll("[data-admin-task-filter]").forEach((filterButtonElement) => {
      const selected = filterButtonElement.dataset.adminTaskFilter === adminTaskFilterValue;
      filterButtonElement.classList.toggle("is-active", selected);
      filterButtonElement.setAttribute("aria-selected", String(selected));
    });
  } else if (button.dataset.complete) {
    const task = demoTasks.find((item) => item.id === Number(button.dataset.complete));
    if (task) {
      task.status = "Completed";
      renderPage();
      showToast("Illustrative task marked complete.");
    }
  } else if (button.dataset.edit) {
    openTaskModal(Number(button.dataset.edit));
  } else if (button.dataset.delete) {
    openDeleteModal(Number(button.dataset.delete));
  } else if (button.dataset.userAction) {
    showToast(`Illustrative user: ${button.dataset.userAction}`);
  }
});

app.addEventListener("submit", (event) => {
  if (event.target.id === "auth-form") {
    handleAuthSubmit(event);
  }
});

app.addEventListener("input", (event) => {
  if (event.target.id === "user-search") updateAdminUsers();
  if (event.target.id === "task-search") updateAdminTaskResults();
});

app.addEventListener("change", (event) => {
  if (event.target.id === "user-role-filter") updateAdminUsers();
});

taskModal.addEventListener("click", (event) => {
  if (event.target === taskModal || event.target.closest("[data-close-modal]")) {
    closeModal(taskModal);
  }
});

deleteModal.addEventListener("click", (event) => {
  if (event.target === deleteModal || event.target.closest("[data-close-delete]")) {
    closeModal(deleteModal);
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeOpenModal();
});

function updateAdminUsers() {
  const search = document.querySelector("#user-search");
  const roleFilter = document.querySelector("#user-role-filter");
  const tableBody = document.querySelector("#user-table-body");
  if (!search || !roleFilter || !tableBody) return;

  const query = search.value.toLowerCase();
  const filtered = demoUsers.filter((user) =>
    (roleFilter.value === "All" || user.role === roleFilter.value) &&
    `${user.name} ${user.email}`.toLowerCase().includes(query)
  );
  tableBody.innerHTML = demoUserRows(filtered);
}

function updateAdminTaskResults() {
  const search = document.querySelector("#task-search");
  const results = document.querySelector("#admin-task-results");
  if (!search || !results) return;

  const query = search.value.toLowerCase();
  const filtered = demoTasks.filter((task) =>
    (adminTaskFilterValue === "All" || task.status === adminTaskFilterValue) &&
    `${task.title} ${task.owner} ${task.description}`.toLowerCase().includes(query)
  );
  results.innerHTML = adminTaskTable(filtered);
}

document.querySelector("#task-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const title = document.querySelector("#task-title").value.trim();
  if (!title) {
    document.querySelector("#task-error").textContent = "Task title is required.";
    document.querySelector("#task-title").setAttribute("aria-invalid", "true");
    return;
  }
  document.querySelector("#task-title").setAttribute("aria-invalid", "false");
  const values = {
    title,
    description: document.querySelector("#task-description").value.trim() || "No description provided.",
    priority: document.querySelector("#task-priority").value,
    due: document.querySelector("#task-due").value || ""
  };
  if (editingTaskId) {
    const task = demoTasks.find((item) => item.id === editingTaskId);
    if (!task) {
      closeModal(taskModal);
      showToast("That illustrative task is no longer available.");
      return;
    }
    Object.assign(task, values);
    showToast("Illustrative task updated.");
  } else {
    demoTasks.push({ id: Date.now(), ...values, status: "Pending", owner: "Om Vithoba" });
    showToast("Illustrative task added.");
  }
  closeModal(taskModal, false);
  document.querySelector("#task-form").reset();
  renderPage();
});

document.querySelector("#confirm-delete").addEventListener("click", () => {
  const index = demoTasks.findIndex((task) => task.id === deletingTaskId);
  if (index < 0) {
    closeModal(deleteModal);
    showToast("That illustrative task is no longer available.");
    return;
  }
  demoTasks.splice(index, 1);
  closeModal(deleteModal, false);
  renderPage();
  showToast("Illustrative task deleted.");
});

function showToast(message) {
  toast.textContent = message;
  toast.hidden = false;
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => toast.hidden = true, 2800);
}

function formatDate(value) {
  if (!value) return "No due date";
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(new Date(`${value}T12:00:00`));
}

function initials(name) {
  return name.split(" ").map((part) => part[0]).slice(0, 2).join("").toUpperCase();
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[character]);
}

renderAuth("login");
