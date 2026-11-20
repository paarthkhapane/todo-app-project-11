"""
FlowTask - Legacy Frontend Preview Server
=========================================
STATUS: SUPERSEDED (Phase 2B)

This standalone preview application was used during Phase 1 (Auth UI) and
Phase 2A (Task UI Foundation) for isolated frontend UI/UX development.

As of Phase 2B Step 1, the unified canonical application is located at:
    backend/app.py

To run the unified application (frontend templates + backend APIs):
    python backend/app.py

This file is preserved for reference and standalone template preview purposes,
but should not be run concurrently with the unified backend application.
"""

from flask import Flask, render_template

app = Flask(__name__)


@app.route("/")
def dashboard():
    return render_template("user/dashboard.html")


@app.route("/login")
def login_page():
    return render_template("login.html")


@app.route("/register")
def register_page():
    return render_template("register.html")


if __name__ == "__main__":
    app.run(debug=True, port=5001)
