
document.addEventListener("DOMContentLoaded", function () {

    // Handle password visibility buttons
    document.querySelectorAll("[data-password-toggle]").forEach(function (button) {
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

    // Support the login page's existing password button
    const loginToggle = document.getElementById("password-toggle");

    if (loginToggle) {
        loginToggle.addEventListener("click", function () {
            const passwordInput = document.getElementById("password");

            if (!passwordInput) return;

            const isPassword = passwordInput.type === "password";

            passwordInput.type = isPassword ? "text" : "password";
            loginToggle.textContent = isPassword ? "Hide" : "Show";
        });
    }

});
