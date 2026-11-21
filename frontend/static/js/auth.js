/**
 * FlowTask - Authentication Logic & API Integration (Phase 2B Step 2)
 * Handles client-side validation, password toggling, loading states,
 * user feedback, JWT/user storage, and backend API integration.
 */

// ========================================================
// 1. Reusable Authentication Storage Utility
// ========================================================
const FlowAuth = (function () {
  const TOKEN_KEY = "flowtask_token";
  const USER_KEY = "flowtask_user";

  function getToken() {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch (e) {
      console.error("Failed to read token from localStorage:", e);
      return null;
    }
  }

  function getUser() {
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      console.error("Failed to read user from localStorage:", e);
      return null;
    }
  }

  function setAuth(token, user) {
    try {
      if (token) {
        localStorage.setItem(TOKEN_KEY, token);
      }
      if (user) {
        localStorage.setItem(USER_KEY, JSON.stringify(user));
      }
    } catch (e) {
      console.error("Failed to save auth data to localStorage:", e);
    }
  }

  function clearAuth() {
    try {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    } catch (e) {
      console.error("Failed to clear auth data from localStorage:", e);
    }
  }

  function isAuthenticated() {
    return Boolean(getToken());
  }

  function logout(redirectUrl) {
    clearAuth();
    window.location.href = redirectUrl || "/login";
  }

  return {
    getToken: getToken,
    getUser: getUser,
    setAuth: setAuth,
    clearAuth: clearAuth,
    isAuthenticated: isAuthenticated,
    logout: logout,
  };
})();

// Expose globally for application-wide and testing access
window.FlowAuth = FlowAuth;

document.addEventListener("DOMContentLoaded", function () {
  // ========================================================
  // 2. Password Visibility Toggle
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
        isPassword ? "Hide password" : "Show password",
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
  // 3. Validation & Feedback Helpers
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
  // 4. Login Page Validation & Backend Integration
  // ========================================================
  const loginForm = document.getElementById("login-form");

  if (loginForm) {
    const emailInput = document.getElementById("login-email");
    const passwordInput = document.getElementById("login-password");
    const emailError = document.getElementById("login-email-error");
    const passwordError = document.getElementById("login-password-error");
    const loginFeedback = document.getElementById("login-feedback");
    const loginGlobalError = document.getElementById("login-error");
    const submitButton =
      document.getElementById("login-submit") ||
      loginForm.querySelector(".auth-submit");

    // Check for URL query notifications (e.g. after successful registration)
    try {
      const urlParams = new URLSearchParams(window.location.search);
      if (
        urlParams.get("registered") === "1" ||
        urlParams.get("registered") === "true"
      ) {
        displayFeedback(
          loginFeedback,
          "Account created successfully! Please log in with your credentials.",
          "success",
        );
      }
    } catch (e) {
      // URLSearchParams fallback
    }

    // Live clearing of errors
    attachLiveClear(emailInput, emailError);
    attachLiveClear(passwordInput, passwordError);

    loginForm.addEventListener("submit", async function (event) {
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
        setFieldError(
          emailInput,
          emailError,
          "Please enter a valid email address (e.g. name@example.com).",
        );
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

      // Loading state & prevent concurrent submissions
      const originalBtnText = submitButton
        ? submitButton.textContent
        : "Log In";
      if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = "Logging in...";
      }

      try {
        const response = await fetch("/api/auth/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: emailValue,
            password: passwordValue,
          }),
        });

        let data = {};
        try {
          data = await response.json();
        } catch (jsonErr) {
          data = {};
        }

        if (response.status === 200 && data.token) {
          // Save JWT token and user profile
          FlowAuth.setAuth(data.token, data.user);

          const redirectTarget =
            data.user && data.user.role === "admin" ? "/admin" : "/";
          displayFeedback(
            loginFeedback,
            `Login successful! Redirecting to ${data.user && data.user.role === "admin" ? "admin console" : "dashboard"}...`,
            "success",
          );

          setTimeout(function () {
            window.location.href = redirectTarget;
          }, 500);
          return;
        } else if (response.status === 401) {
          const errorMsg = data.error || "Invalid email or password.";
          displayFeedback(loginFeedback, errorMsg, "error");

          if (passwordInput) {
            passwordInput.focus();
          }
        } else if (response.status === 400) {
          const errorMsg =
            data.error || "Both email and password are required.";
          displayFeedback(loginFeedback, errorMsg, "error");
        } else {
          const errorMsg =
            data.error ||
            "Unable to log in due to a server error. Please try again.";
          displayFeedback(loginFeedback, errorMsg, "error");
        }
      } catch (networkErr) {
        displayFeedback(
          loginFeedback,
          "Unable to connect to the authentication server. Please check your network connection and try again.",
          "error",
        );
      } finally {
        if (submitButton) {
          submitButton.disabled = false;
          submitButton.textContent = originalBtnText;
        }
      }
    });
  }

  // ========================================================
  // 5. Registration Page Validation & Backend Integration
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
    const submitButton =
      document.getElementById("register-submit") ||
      registerForm.querySelector(".auth-submit");

    // Live clearing of errors
    attachLiveClear(nameInput, nameError);
    attachLiveClear(emailInput, emailError);
    attachLiveClear(passwordInput, passwordError);
    attachLiveClear(confirmInput, confirmError);

    registerForm.addEventListener("submit", async function (event) {
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
        setFieldError(
          nameInput,
          nameError,
          "Full name must be at least 2 characters.",
        );
        isValid = false;
        if (!firstInvalidField) firstInvalidField = nameInput;
      }

      // Validate Email
      if (!emailValue) {
        setFieldError(emailInput, emailError, "Email address is required.");
        isValid = false;
        if (!firstInvalidField) firstInvalidField = emailInput;
      } else if (!isValidEmail(emailValue)) {
        setFieldError(
          emailInput,
          emailError,
          "Please enter a valid email address (e.g. name@example.com).",
        );
        isValid = false;
        if (!firstInvalidField) firstInvalidField = emailInput;
      }

      // Validate Password (minimum 8 characters)
      if (!passwordValue) {
        setFieldError(passwordInput, passwordError, "Password is required.");
        isValid = false;
        if (!firstInvalidField) firstInvalidField = passwordInput;
      } else if (passwordValue.length < 8) {
        setFieldError(
          passwordInput,
          passwordError,
          "Password must be at least 8 characters long.",
        );
        isValid = false;
        if (!firstInvalidField) firstInvalidField = passwordInput;
      }

      // Validate Confirm Password
      if (!confirmValue) {
        setFieldError(
          confirmInput,
          confirmError,
          "Please confirm your password.",
        );
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

      // Loading state & prevent concurrent submissions
      const originalBtnText = submitButton
        ? submitButton.textContent
        : "Create Account";
      if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = "Creating account...";
      }

      try {
        // Dispatch registration to API (confirm_password intentionally omitted)
        const response = await fetch("/api/auth/register", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: nameValue,
            email: emailValue,
            password: passwordValue,
          }),
        });

        let data = {};
        try {
          data = await response.json();
        } catch (jsonErr) {
          data = {};
        }

        if (response.status === 201) {
          displayFeedback(
            registerFeedback,
            "Account created successfully! Redirecting to login...",
            "success",
          );

          setTimeout(function () {
            window.location.href = "/login?registered=1";
          }, 800);
          return;
        } else if (response.status === 409) {
          // Duplicate email conflict
          const errorMsg = data.error || "This email is already registered.";
          setFieldError(emailInput, emailError, errorMsg);
          displayFeedback(registerFeedback, errorMsg, "error");
          if (emailInput) {
            emailInput.focus();
          }
        } else if (response.status === 400) {
          const errorMsg =
            data.error || "Please check your registration details.";
          displayFeedback(registerFeedback, errorMsg, "error");
        } else {
          const errorMsg =
            data.error ||
            "Server error occurred during account creation. Please try again.";
          displayFeedback(registerFeedback, errorMsg, "error");
        }
      } catch (networkErr) {
        displayFeedback(
          registerFeedback,
          "Unable to connect to the registration server. Please check your network connection and try again.",
          "error",
        );
      } finally {
        if (submitButton) {
          submitButton.disabled = false;
          submitButton.textContent = originalBtnText;
        }
      }
    });
  }
});
