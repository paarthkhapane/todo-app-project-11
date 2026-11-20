/**
 * FlowTask - Authentication Logic
 * Handles client-side validation, password toggling, loading states,
 * and user feedback placeholders for Login and Registration.
 */

document.addEventListener("DOMContentLoaded", function () {

    // ========================================================
    // 1. Password Visibility Toggle
    // ========================================================
    const passwordButtons = document.querySelectorAll("[data-password-toggle]");

    passwordButtons.forEach(function (button) {
        button.addEventListener("click", function () {
            const inputId = button.dataset.passwordToggle;
            const passwordInput = document.getElementById(inputId);

            if (!passwordInput) return;

            const isPassword = passwordInput.type === "password";
            passwordInput.type = isPassword ? "text" : "password";
            button.textContent = isPassword ? "Hide" : "Show";
            button.setAttribute(
                "aria-label",
                isPassword ? "Hide password" : "Show password"
            );
        });
    });

    // Support legacy/fallback ID toggle if present
    const legacyToggle = document.getElementById("password-toggle");
    if (legacyToggle && !legacyToggle.dataset.passwordToggle) {
        legacyToggle.addEventListener("click", function () {
            const passwordInput = document.getElementById("password");
            if (!passwordInput) return;

            const isPassword = passwordInput.type === "password";
            passwordInput.type = isPassword ? "text" : "password";
            legacyToggle.textContent = isPassword ? "Hide" : "Show";
        });
    }

    // ========================================================
    // 2. Validation & Feedback Helpers
    // ========================================================

    /**
     * Standard RFC 5322 compatible email format check
     */
    function isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email.trim());
    }

    /**
     * Sets error message and accessible state for an input field
     */
    function setFieldError(input, errorElement, message) {
        if (errorElement) {
            errorElement.textContent = message;
        }
        if (input) {
            input.setAttribute("aria-invalid", "true");
        }
    }

    /**
     * Clears error message and resets accessible state for an input field
     */
    function clearFieldError(input, errorElement) {
        if (errorElement) {
            errorElement.textContent = "";
        }
        if (input) {
            input.removeAttribute("aria-invalid");
        }
    }

    /**
     * Clears all field errors and feedback boxes within a form
     */
    function resetFormState(form, feedbackElement, globalErrorElement) {
        const inputs = form.querySelectorAll(".input");
        inputs.forEach(function (input) {
            input.removeAttribute("aria-invalid");
        });

        const errors = form.querySelectorAll(".field-error");
        errors.forEach(function (err) {
            err.textContent = "";
        });

        if (globalErrorElement) {
            globalErrorElement.textContent = "";
        }

        if (feedbackElement) {
            feedbackElement.hidden = true;
            feedbackElement.textContent = "";
            feedbackElement.className = "auth-feedback";
        }
    }

    /**
     * Displays a feedback banner (info, success, or error)
     */
    function displayFeedback(feedbackElement, message, type) {
        if (!feedbackElement) return;

        feedbackElement.hidden = false;
        feedbackElement.className = "auth-feedback feedback-" + (type || "info");
        feedbackElement.textContent = message;
    }

    /**
     * Connects live input listeners to clear errors on typing
     */
    function attachLiveClear(input, errorElement) {
        if (!input) return;

        input.addEventListener("input", function () {
            if (input.getAttribute("aria-invalid") === "true") {
                clearFieldError(input, errorElement);
            }
        });
    }

    // ========================================================
    // 3. Login Page Validation & Submission
    // ========================================================
    const loginForm = document.getElementById("login-form");

    if (loginForm) {
        const emailInput = document.getElementById("login-email");
        const passwordInput = document.getElementById("login-password");
        const emailError = document.getElementById("login-email-error");
        const passwordError = document.getElementById("login-password-error");
        const loginFeedback = document.getElementById("login-feedback");
        const loginGlobalError = document.getElementById("login-error");
        const submitButton = document.getElementById("login-submit") || loginForm.querySelector(".auth-submit");

        // Live clearing of errors
        attachLiveClear(emailInput, emailError);
        attachLiveClear(passwordInput, passwordError);

        loginForm.addEventListener("submit", function (event) {
            event.preventDefault();

            resetFormState(loginForm, loginFeedback, loginGlobalError);

            const emailValue = emailInput ? emailInput.value.trim() : "";
            const passwordValue = passwordInput ? passwordInput.value : "";

            let isValid = true;
            let firstInvalidField = null;

            // Validate Email
            if (!emailValue) {
                setFieldError(emailInput, emailError, "Email address is required.");
                isValid = false;
                if (!firstInvalidField) firstInvalidField = emailInput;
            } else if (!isValidEmail(emailValue)) {
                setFieldError(emailInput, emailError, "Please enter a valid email address (e.g. name@example.com).");
                isValid = false;
                if (!firstInvalidField) firstInvalidField = emailInput;
            }

            // Validate Password
            if (!passwordValue) {
                setFieldError(passwordInput, passwordError, "Password is required.");
                isValid = false;
                if (!firstInvalidField) firstInvalidField = passwordInput;
            }

            if (!isValid) {
                if (firstInvalidField) {
                    firstInvalidField.focus();
                }
                return;
            }

            // Client-side placeholder loading state
            if (submitButton) {
                const originalText = submitButton.textContent;
                submitButton.disabled = true;
                submitButton.textContent = "Logging in...";

                setTimeout(function () {
                    submitButton.disabled = false;
                    submitButton.textContent = originalText;

                    displayFeedback(
                        loginFeedback,
                        "Login form validated successfully. Note: Backend authentication is not yet connected in this preview. API integration will be implemented in the next phase.",
                        "info"
                    );
                }, 500);
            }
        });
    }

    // ========================================================
    // 4. Registration Page Validation & Submission
    // ========================================================
    const registerForm = document.getElementById("register-form");

    if (registerForm) {
        const nameInput = document.getElementById("full-name");
        const emailInput = document.getElementById("email");
        const passwordInput = document.getElementById("password");
        const confirmInput = document.getElementById("confirm-password");

        const nameError = document.getElementById("name-error");
        const emailError = document.getElementById("email-error");
        const passwordError = document.getElementById("password-error");
        const confirmError = document.getElementById("confirm-error");
        const registerFeedback = document.getElementById("register-feedback");
        const registerGlobalError = document.getElementById("register-error");
        const submitButton = document.getElementById("register-submit") || registerForm.querySelector(".auth-submit");

        // Live clearing of errors
        attachLiveClear(nameInput, nameError);
        attachLiveClear(emailInput, emailError);
        attachLiveClear(passwordInput, passwordError);
        attachLiveClear(confirmInput, confirmError);

        registerForm.addEventListener("submit", function (event) {
            event.preventDefault();

            resetFormState(registerForm, registerFeedback, registerGlobalError);

            const nameValue = nameInput ? nameInput.value.trim() : "";
            const emailValue = emailInput ? emailInput.value.trim() : "";
            const passwordValue = passwordInput ? passwordInput.value : "";
            const confirmValue = confirmInput ? confirmInput.value : "";

            let isValid = true;
            let firstInvalidField = null;

            // Validate Full Name
            if (!nameValue) {
                setFieldError(nameInput, nameError, "Full name is required.");
                isValid = false;
                if (!firstInvalidField) firstInvalidField = nameInput;
            } else if (nameValue.length < 2) {
                setFieldError(nameInput, nameError, "Full name must be at least 2 characters.");
                isValid = false;
                if (!firstInvalidField) firstInvalidField = nameInput;
            }

            // Validate Email
            if (!emailValue) {
                setFieldError(emailInput, emailError, "Email address is required.");
                isValid = false;
                if (!firstInvalidField) firstInvalidField = emailInput;
            } else if (!isValidEmail(emailValue)) {
                setFieldError(emailInput, emailError, "Please enter a valid email address (e.g. name@example.com).");
                isValid = false;
                if (!firstInvalidField) firstInvalidField = emailInput;
            }

            // Validate Password (minimum 8 characters)
            if (!passwordValue) {
                setFieldError(passwordInput, passwordError, "Password is required.");
                isValid = false;
                if (!firstInvalidField) firstInvalidField = passwordInput;
            } else if (passwordValue.length < 8) {
                setFieldError(passwordInput, passwordError, "Password must be at least 8 characters long.");
                isValid = false;
                if (!firstInvalidField) firstInvalidField = passwordInput;
            }

            // Validate Confirm Password
            if (!confirmValue) {
                setFieldError(confirmInput, confirmError, "Please confirm your password.");
                isValid = false;
                if (!firstInvalidField) firstInvalidField = confirmInput;
            } else if (passwordValue !== confirmValue) {
                setFieldError(confirmInput, confirmError, "Passwords do not match.");
                isValid = false;
                if (!firstInvalidField) firstInvalidField = confirmInput;
            }

            if (!isValid) {
                if (firstInvalidField) {
                    firstInvalidField.focus();
                }
                return;
            }

            // Client-side placeholder loading state
            if (submitButton) {
                const originalText = submitButton.textContent;
                submitButton.disabled = true;
                submitButton.textContent = "Creating account...";

                setTimeout(function () {
                    submitButton.disabled = false;
                    submitButton.textContent = originalText;

                    displayFeedback(
                        registerFeedback,
                        "Registration form validated successfully. Note: Backend authentication is not yet connected in this preview. Account creation will be connected to the backend in the next phase.",
                        "info"
                    );
                }, 500);
            }
        });
    }

});
