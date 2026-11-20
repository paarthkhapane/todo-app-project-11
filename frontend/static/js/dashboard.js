document.addEventListener("DOMContentLoaded", function () {

    // Display current date
    const dateElement = document.getElementById("dashboard-date");

    if (dateElement) {
        const today = new Date();

        dateElement.textContent = today.toLocaleDateString("en-IN", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric"
        });
    }


    // Task filter buttons
    const filterButtons = document.querySelectorAll("[data-filter]");

    filterButtons.forEach(function (button) {
        button.addEventListener("click", function () {

            filterButtons.forEach(function (btn) {
                btn.classList.remove("active");
            });

            button.classList.add("active");

            console.log("Selected task filter:", button.dataset.filter);
        });
    });


    // Task modal elements
    const taskModal = document.getElementById("task-modal");
    const taskForm = document.getElementById("task-form");

    const addTaskButtons = [
        document.getElementById("add-task-btn"),
        document.getElementById("empty-add-task-btn")
    ];

    const closeModalButton = document.getElementById("close-task-modal");
    const cancelModalButton = document.getElementById("cancel-task-modal");

    const taskTitleInput = document.getElementById("task-title");
    const taskDateInput = document.getElementById("task-due-date");

    // Open modal
    function openTaskModal() {
        if (!taskModal) return;

        taskModal.hidden = false;
        clearErrors();
        document.body.style.overflow = "hidden";

        if (taskTitleInput) {
            taskTitleInput.focus();
        }
    }

    // Close modal
    function closeTaskModal() {
        if (!taskModal) return;

        taskModal.hidden = true;
        document.body.style.overflow = "";

        if (taskForm) {
            taskForm.reset();
        }

        clearErrors();
    }

    // Clear validation messages
    function clearErrors() {
        const errorElements = [
            document.getElementById("task-title-error"),
            document.getElementById("task-date-error"),
            document.getElementById("task-form-error")
        ];

        errorElements.forEach(function (element) {
            if (element) {
                element.textContent = "";
            }
        });
    }

    // Connect buttons
    addTaskButtons.forEach(function (button) {
        if (button) {
            button.addEventListener("click", openTaskModal);
        }
    });

    if (closeModalButton) {
        closeModalButton.addEventListener("click", closeTaskModal);
    }

    if (cancelModalButton) {
        cancelModalButton.addEventListener("click", closeTaskModal);
    }

    // Close when clicking outside modal
    if (taskModal) {
        taskModal.addEventListener("click", function (event) {
            if (event.target === taskModal) {
                closeTaskModal();
            }
        });
    }

    // Close using Escape
    document.addEventListener("keydown", function (event) {
        if (event.key === "Escape" && taskModal && !taskModal.hidden) {
            closeTaskModal();
        }
    });


    // Form validation
    if (taskForm) {
        taskForm.addEventListener("submit", function (event) {
            event.preventDefault();

            clearErrors();

            const title = taskTitleInput ? taskTitleInput.value.trim() : "";
            const dueDate = taskDateInput ? taskDateInput.value : "";

            let valid = true;

            if (!title) {
                const titleError = document.getElementById("task-title-error");

                if (titleError) {
                    titleError.textContent = "Task title is required.";
                }

                valid = false;
            }

            if (!dueDate) {
                const dateError = document.getElementById("task-date-error");

                if (dateError) {
                    dateError.textContent = "Due date is required.";
                }

                valid = false;
            }

            if (!valid) {
                return;
            }

            // API integration will be added later.
            const formError = document.getElementById("task-form-error");

            if (formError) {
                formError.textContent =
                    "The form is validated. Task saving will be connected to the backend.";
            }

        });
    }

});