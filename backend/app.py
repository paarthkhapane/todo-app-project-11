import os
import sys
from datetime import datetime
from pathlib import Path
from urllib.parse import quote_plus
from dotenv import load_dotenv
from flask import Flask, jsonify, request

# Ensure backend directory is in the Python search path
BACKEND_DIR = Path(__file__).resolve().parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

# Load environment variables from the root .env file
ROOT_DIR = BACKEND_DIR.parent
dotenv_path = ROOT_DIR / ".env"
load_dotenv(dotenv_path=dotenv_path)

# Initialize Flask application
app = Flask(__name__)

# Database configuration loaded from environment variables
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "3306")
DB_NAME = os.getenv("DB_NAME", "todo_app")
DB_USER = os.getenv("DB_USER", "root")
DB_PASSWORD = os.getenv("DB_PASSWORD", "")

# Safely format credentials without hardcoding passwords
if DB_PASSWORD:
    encoded_password = quote_plus(DB_PASSWORD)
    db_credentials = f"{DB_USER}:{encoded_password}"
else:
    db_credentials = DB_USER

# Configure Flask-SQLAlchemy with PyMySQL
app.config["SQLALCHEMY_DATABASE_URI"] = (
    f"mysql+pymysql://{db_credentials}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
)
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

# Import db and models from models.py (avoids circular imports)
from models import db, User, Task, Category

# Initialize SQLAlchemy with the Flask app instance
db.init_app(app)

# Import reusable authentication helpers from auth.py
from auth import (
    get_jwt_secret_key,
    hash_password,
    verify_password,
    generate_token,
    token_required
)

# Allowed status and priority values matching database schema
ALLOWED_STATUSES = {"pending", "in_progress", "completed"}
ALLOWED_PRIORITIES = {"low", "medium", "high"}


# Health check test route
@app.route("/", methods=["GET"])
def index():
    return jsonify({
        "status": "success",
        "message": "Flask backend is running"
    })


# ==========================================
# Authentication Endpoints
# ==========================================

@app.route("/api/auth/register", methods=["POST"])
def register():
    data = request.get_json(silent=True)
    if data is None or not isinstance(data, dict):
        return jsonify({"error": "Request body must be valid JSON"}), 400

    name = data.get("name")
    email = data.get("email")
    password = data.get("password")

    # Validate required fields
    if not name or not isinstance(name, str) or not name.strip():
        return jsonify({"error": "'name' is required and cannot be empty"}), 400

    if not email or not isinstance(email, str) or not email.strip():
        return jsonify({"error": "'email' is required and cannot be empty"}), 400

    if not password or not isinstance(password, str) or not password.strip():
        return jsonify({"error": "'password' is required and cannot be empty"}), 400

    cleaned_email = email.strip().lower()

    # Check whether the email already exists
    try:
        existing_user = User.query.filter_by(email=cleaned_email).first()
    except Exception:
        return jsonify({"error": "Database error while checking email availability"}), 500

    if existing_user:
        return jsonify({"error": "Email is already registered"}), 409

    # Hash the password securely and assign default role 'user'
    hashed_password = hash_password(password)
    new_user = User(
        name=name.strip(),
        email=cleaned_email,
        password_hash=hashed_password,
        role="user"
    )

    try:
        db.session.add(new_user)
        db.session.commit()
        return jsonify({
            "message": "User registered successfully",
            "user": new_user.to_dict()
        }), 201
    except Exception:
        db.session.rollback()
        return jsonify({"error": "Database error while registering user"}), 500


@app.route("/api/auth/login", methods=["POST"])
def login():
    data = request.get_json(silent=True)
    if data is None or not isinstance(data, dict):
        return jsonify({"error": "Request body must be valid JSON"}), 400

    email = data.get("email")
    password = data.get("password")

    if not email or not isinstance(email, str) or not email.strip() or not password or not isinstance(password, str):
        return jsonify({"error": "Both 'email' and 'password' are required"}), 400

    try:
        user = User.query.filter_by(email=email.strip().lower()).first()
    except Exception:
        return jsonify({"error": "Database error while logging in"}), 500

    # Verify password without revealing if email or password was incorrect
    if not user or not verify_password(user.password_hash, password):
        return jsonify({"error": "Invalid email or password"}), 401

    # Generate JWT token using auth helper
    try:
        token = generate_token(user.id, user.role)
    except ValueError as e:
        return jsonify({"error": str(e)}), 500

    return jsonify({
        "token": token,
        "user": user.to_dict()
    }), 200


# ==========================================
# Protected Task CRUD Endpoints
# ==========================================

# Task Creation API Endpoint
@app.route("/api/tasks", methods=["POST"])
@token_required
def create_task(current_user):
    # 1. Read JSON request body
    data = request.get_json(silent=True)
    if data is None or not isinstance(data, dict):
        return jsonify({"error": "Request body must be valid JSON"}), 400

    # 2. Validate required title
    title = data.get("title")
    if not title or not isinstance(title, str) or not title.strip():
        return jsonify({"error": "'title' is required and cannot be empty"}), 400

    # 3. Read optional fields
    description = data.get("description")
    status = data.get("status")
    priority = data.get("priority")
    due_date_raw = data.get("due_date")
    category_id = data.get("category_id")

    # Validate status against allowed values
    if status is not None:
        if status not in ALLOWED_STATUSES:
            return jsonify({
                "error": f"Invalid 'status'. Allowed values are: {', '.join(sorted(ALLOWED_STATUSES))}"
            }), 400

    # Validate priority against allowed values
    if priority is not None:
        if priority not in ALLOWED_PRIORITIES:
            return jsonify({
                "error": f"Invalid 'priority'. Allowed values are: {', '.join(sorted(ALLOWED_PRIORITIES))}"
            }), 400

    # Parse optional due_date
    due_date = None
    if due_date_raw:
        try:
            due_date = datetime.fromisoformat(due_date_raw)
        except (ValueError, TypeError):
            return jsonify({
                "error": "Invalid 'due_date' format. Please use ISO 8601 format (e.g., YYYY-MM-DD or YYYY-MM-DDTHH:MM:SS)"
            }), 400

    # Validate optional category_id and verify ownership
    if category_id is not None:
        if not isinstance(category_id, int):
            return jsonify({"error": "'category_id' must be an integer"}), 400
        try:
            category = db.session.get(Category, category_id)
        except Exception:
            return jsonify({"error": "Database error while verifying category"}), 500

        if not category:
            return jsonify({"error": "Category not found"}), 404

        if category.user_id != current_user.id:
            return jsonify({"error": "You do not have permission to attach this category"}), 403

    # 4. Instantiate Task object bound to authenticated user
    task = Task(
        user_id=current_user.id,
        category_id=category_id,
        title=title.strip(),
        description=description,
        status=status if status is not None else "pending",
        priority=priority if priority is not None else "medium",
        due_date=due_date
    )

    # 5. Persist to database with safe rollback on error
    try:
        db.session.add(task)
        db.session.commit()
        return jsonify(task.to_dict()), 201
    except Exception:
        db.session.rollback()
        return jsonify({"error": "Database error while creating task"}), 500


# Task Retrieval API Endpoint (Only authenticated user's tasks)
@app.route("/api/tasks", methods=["GET"])
@token_required
def get_tasks(current_user):
    try:
        tasks = Task.query.filter_by(user_id=current_user.id).all()
        return jsonify([task.to_dict() for task in tasks]), 200
    except Exception:
        return jsonify({"error": "Database error while fetching tasks"}), 500


# Single Task Retrieval API Endpoint (Ownership enforced)
@app.route("/api/tasks/<int:task_id>", methods=["GET"])
@token_required
def get_task(current_user, task_id):
    try:
        task = db.session.get(Task, task_id)
    except Exception:
        return jsonify({"error": "Database error while fetching task"}), 500

    if not task:
        return jsonify({"error": "Task not found"}), 404

    if task.user_id != current_user.id:
        return jsonify({"error": "You do not have permission to access this task"}), 403

    return jsonify(task.to_dict()), 200


# Task Update API Endpoint (Ownership enforced)
@app.route("/api/tasks/<int:task_id>", methods=["PUT"])
@token_required
def update_task(current_user, task_id):
    # 1. Find the existing task by ID
    try:
        task = db.session.get(Task, task_id)
    except Exception:
        return jsonify({"error": "Database error while fetching task"}), 500

    if not task:
        return jsonify({"error": "Task not found"}), 404

    # 2. Enforce ownership
    if task.user_id != current_user.id:
        return jsonify({"error": "You do not have permission to modify this task"}), 403

    # 3. Read and validate JSON request body
    data = request.get_json(silent=True)
    if data is None or not isinstance(data, dict):
        return jsonify({"error": "Request body must be valid JSON"}), 400

    # 4. Validate and update 'title' if provided
    if "title" in data:
        title = data.get("title")
        if not title or not isinstance(title, str) or not title.strip():
            return jsonify({"error": "'title' must be a non-empty string"}), 400
        task.title = title.strip()

    # 5. Update 'description' if provided
    if "description" in data:
        task.description = data.get("description")

    # 6. Validate and update 'status' if provided
    if "status" in data:
        status = data.get("status")
        if status not in ALLOWED_STATUSES:
            return jsonify({
                "error": f"Invalid 'status'. Allowed values are: {', '.join(sorted(ALLOWED_STATUSES))}"
            }), 400
        task.status = status

    # 7. Validate and update 'priority' if provided
    if "priority" in data:
        priority = data.get("priority")
        if priority not in ALLOWED_PRIORITIES:
            return jsonify({
                "error": f"Invalid 'priority'. Allowed values are: {', '.join(sorted(ALLOWED_PRIORITIES))}"
            }), 400
        task.priority = priority

    # 8. Validate and update 'due_date' if provided
    if "due_date" in data:
        due_date_raw = data.get("due_date")
        if due_date_raw is None or due_date_raw == "":
            task.due_date = None
        else:
            try:
                task.due_date = datetime.fromisoformat(due_date_raw)
            except (ValueError, TypeError):
                return jsonify({
                    "error": "Invalid 'due_date' format. Please use ISO 8601 format (e.g., YYYY-MM-DD or YYYY-MM-DDTHH:MM:SS)"
                }), 400

    # 9. Validate and update 'category_id' if provided
    if "category_id" in data:
        category_id = data.get("category_id")
        if category_id is None or category_id == "":
            task.category_id = None
        else:
            if not isinstance(category_id, int):
                return jsonify({"error": "'category_id' must be an integer"}), 400
            try:
                category = db.session.get(Category, category_id)
            except Exception:
                return jsonify({"error": "Database error while verifying category"}), 500

            if not category:
                return jsonify({"error": "Category not found"}), 404

            if category.user_id != current_user.id:
                return jsonify({"error": "You do not have permission to attach this category"}), 403

            task.category_id = category_id

    # user_id is deliberately immutable

    # Update updated_at timestamp
    task.updated_at = datetime.utcnow()

    # 10. Commit changes to the database
    try:
        db.session.commit()
        return jsonify(task.to_dict()), 200
    except Exception:
        db.session.rollback()
        return jsonify({"error": "Database error while updating task"}), 500


# Task Deletion API Endpoint (Ownership enforced)
@app.route("/api/tasks/<int:task_id>", methods=["DELETE"])
@token_required
def delete_task(current_user, task_id):
    # 1. Find the existing task by ID
    try:
        task = db.session.get(Task, task_id)
    except Exception:
        return jsonify({"error": "Database error while fetching task"}), 500

    if not task:
        return jsonify({"error": "Task not found"}), 404

    # 2. Enforce ownership
    if task.user_id != current_user.id:
        return jsonify({"error": "You do not have permission to delete this task"}), 403

    # 3. Delete the task and commit transaction
    try:
        db.session.delete(task)
        db.session.commit()
        return jsonify({"message": "Task deleted successfully"}), 200
    except Exception:
        db.session.rollback()
        return jsonify({"error": "Database error while deleting task"}), 500


if __name__ == "__main__":
    app.run(debug=True)
