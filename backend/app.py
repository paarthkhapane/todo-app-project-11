"""
FlowTask - Unified Flask Application (Phase 2B)
Serves existing frontend HTML/Jinja templates, static assets, and RESTful API endpoints.
"""

import os
import sys
from datetime import datetime
from pathlib import Path
from urllib.parse import quote_plus
from flask import Flask, jsonify, render_template, request

# Ensure backend directory is in the Python search path
BACKEND_DIR = Path(__file__).resolve().parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

# Resolve root, frontend template, and static directories
ROOT_DIR = BACKEND_DIR.parent
TEMPLATE_DIR = ROOT_DIR / "frontend" / "templates"
STATIC_DIR = ROOT_DIR / "frontend" / "static"

# Load environment variables from the root .env file if available
dotenv_path = ROOT_DIR / ".env"
try:
    from dotenv import load_dotenv
    load_dotenv(dotenv_path=dotenv_path)
except ImportError:
    pass

# Initialize unified Flask application with template and static folder mappings
app = Flask(
    __name__,
    template_folder=str(TEMPLATE_DIR),
    static_folder=str(STATIC_DIR),
    static_url_path="/static"
)

# Database configuration loaded from environment variables
# Reconciled default database name to 'todo_app' per database/schema.sql
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

# Import db and models
try:
    from models import db, User, Task, Category
except ImportError:
    from backend.models import db, User, Task, Category

# Initialize SQLAlchemy with the Flask app instance
db.init_app(app)

# Import reusable authentication helpers from auth.py
try:
    from auth import (
        get_jwt_secret_key,
        hash_password,
        verify_password,
        generate_token,
        token_required,
        admin_required
    )
except ImportError:
    from backend.auth import (
        get_jwt_secret_key,
        hash_password,
        verify_password,
        generate_token,
        token_required,
        admin_required
    )


# ==========================================
# 1. Frontend Page Routes
# ==========================================

@app.route("/", methods=["GET"])
def dashboard_page():
    """Render the user dashboard template."""
    return render_template("user/dashboard.html")


@app.route("/login", methods=["GET"])
def login_page():
    """Render the authentication login template."""
    return render_template("login.html")


@app.route("/register", methods=["GET"])
def register_page():
    """Render the authentication registration template."""
    return render_template("register.html")


@app.route("/admin", methods=["GET"])
def admin_page():
    """Render the admin dashboard template."""
    return render_template("admin/dashboard.html")


# ==========================================
# 2. Application Health Check Route
# ==========================================

@app.route("/api/health", methods=["GET"])
def health_check():
    """Confirm that the Flask application and API services are running."""
    return jsonify({
        "status": "success",
        "message": "Flask backend is running"
    }), 200


# ==========================================
# 3. Authentication API Endpoints
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
# 4. Protected Task CRUD Endpoints
# ==========================================

VALID_PRIORITIES = {"low", "medium", "high"}
VALID_STATUSES = {"pending", "in_progress", "completed"}


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
    status_raw = data.get("status")
    priority_raw = data.get("priority")
    due_date_raw = data.get("due_date")

    # Validate status
    if status_raw is not None:
        if not isinstance(status_raw, str) or status_raw.lower() not in VALID_STATUSES:
            return jsonify({
                "error": f"Invalid 'status'. Allowed values: {', '.join(sorted(VALID_STATUSES))}"
            }), 400
        status = status_raw.lower()
    else:
        status = "pending"

    # Validate priority
    if priority_raw is not None:
        if not isinstance(priority_raw, str) or priority_raw.lower() not in VALID_PRIORITIES:
            return jsonify({
                "error": f"Invalid 'priority'. Allowed values: {', '.join(sorted(VALID_PRIORITIES))}"
            }), 400
        priority = priority_raw.lower()
    else:
        priority = "medium"

    # Parse optional due_date
    due_date = None
    if due_date_raw:
        try:
            due_date = datetime.fromisoformat(due_date_raw)
        except (ValueError, TypeError):
            return jsonify({
                "error": "Invalid 'due_date' format. Please use ISO 8601 format (e.g., YYYY-MM-DD or YYYY-MM-DDTHH:MM:SS)"
            }), 400

    # Resolve optional category scoped to authenticated user
    category_id = None
    category_raw = data.get("category")
    if category_raw and isinstance(category_raw, str) and category_raw.strip():
        clean_cat = category_raw.strip()
        cat_obj = Category.query.filter_by(user_id=current_user.id, name=clean_cat).first()
        if not cat_obj:
            cat_obj = Category(user_id=current_user.id, name=clean_cat)
            db.session.add(cat_obj)
            db.session.flush()
        category_id = cat_obj.id
    elif data.get("category_id"):
        cid = data.get("category_id")
        cat_obj = db.session.get(Category, cid)
        if cat_obj and cat_obj.user_id == current_user.id:
            category_id = cat_obj.id

    # 4. Instantiate Task object bound to authenticated user
    task = Task(
        user_id=current_user.id,
        category_id=category_id,
        title=title.strip(),
        description=description,
        status=status,
        priority=priority,
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

    # 6. Update 'status' if provided
    if "status" in data:
        status_raw = data.get("status")
        if status_raw is not None:
            if not isinstance(status_raw, str) or status_raw.lower() not in VALID_STATUSES:
                return jsonify({
                    "error": f"Invalid 'status'. Allowed values: {', '.join(sorted(VALID_STATUSES))}"
                }), 400
            task.status = status_raw.lower()

    # 7. Update 'priority' if provided
    if "priority" in data:
        priority_raw = data.get("priority")
        if priority_raw is not None:
            if not isinstance(priority_raw, str) or priority_raw.lower() not in VALID_PRIORITIES:
                return jsonify({
                    "error": f"Invalid 'priority'. Allowed values: {', '.join(sorted(VALID_PRIORITIES))}"
                }), 400
            task.priority = priority_raw.lower()

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

    # 9. Update 'category' if provided
    if "category" in data:
        category_raw = data.get("category")
        if category_raw is None or (isinstance(category_raw, str) and not category_raw.strip()):
            task.category_id = None
        elif isinstance(category_raw, str):
            clean_cat = category_raw.strip()
            cat_obj = Category.query.filter_by(user_id=current_user.id, name=clean_cat).first()
            if not cat_obj:
                cat_obj = Category(user_id=current_user.id, name=clean_cat)
                db.session.add(cat_obj)
                db.session.flush()
            task.category_id = cat_obj.id
    elif "category_id" in data:
        cid = data.get("category_id")
        if cid is None or cid == "":
            task.category_id = None
        else:
            cat_obj = db.session.get(Category, cid)
            if cat_obj and cat_obj.user_id == current_user.id:
                task.category_id = cat_obj.id

    # user_id is deliberately immutable

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


# ==========================================
# 5. Protected Administrator API Endpoints
# ==========================================

# 5.1 System-wide Statistics (Admin Only)
@app.route("/api/admin/stats", methods=["GET"])
@token_required
@admin_required
def get_admin_stats(current_user):
    """
    Retrieve real database metrics across the entire application:
    Total users, admins, tasks by status/priority, categories, and recent activity.
    """
    try:
        total_users = User.query.count()
        admin_count = User.query.filter_by(role="admin").count()
        regular_users = total_users - admin_count

        total_tasks = Task.query.count()
        pending_tasks = Task.query.filter_by(status="pending").count()
        in_progress_tasks = Task.query.filter_by(status="in_progress").count()
        completed_tasks = Task.query.filter_by(status="completed").count()

        low_priority = Task.query.filter_by(priority="low").count()
        medium_priority = Task.query.filter_by(priority="medium").count()
        high_priority = Task.query.filter_by(priority="high").count()

        total_categories = Category.query.count()
        completion_rate = round((completed_tasks / total_tasks * 100), 1) if total_tasks > 0 else 0.0

        # Recent 5 registrations
        recent_users_list = User.query.order_by(User.created_at.desc()).limit(5).all()
        recent_users = []
        for u in recent_users_list:
            u_dict = u.to_dict()
            u_dict["task_count"] = len(u.tasks)
            recent_users.append(u_dict)

        return jsonify({
            "total_users": total_users,
            "admin_count": admin_count,
            "regular_user_count": regular_users,
            "total_tasks": total_tasks,
            "pending_tasks": pending_tasks,
            "in_progress_tasks": in_progress_tasks,
            "completed_tasks": completed_tasks,
            "completion_rate": completion_rate,
            "priority_breakdown": {
                "low": low_priority,
                "medium": medium_priority,
                "high": high_priority
            },
            "total_categories": total_categories,
            "recent_users": recent_users
        }), 200
    except Exception as e:
        return jsonify({"error": f"Database error while calculating admin stats: {str(e)}"}), 500


# 5.2 User Management: List & Search Users (Admin Only)
@app.route("/api/admin/users", methods=["GET"])
@token_required
@admin_required
def get_admin_users(current_user):
    """
    List registered users with task counts and search/filter capability.
    """
    try:
        search_query = request.args.get("q", "").strip()
        role_filter = request.args.get("role", "all").strip().lower()

        query = User.query
        if search_query:
            pattern = f"%{search_query}%"
            query = query.filter((User.name.ilike(pattern)) | (User.email.ilike(pattern)))

        if role_filter in ("user", "admin"):
            query = query.filter_by(role=role_filter)

        users = query.order_by(User.created_at.desc()).all()
        results = []
        for u in users:
            u_dict = u.to_dict()
            u_dict["task_count"] = len(u.tasks)
            u_dict["completed_task_count"] = sum(1 for t in u.tasks if t.status == "completed")
            u_dict["is_current_admin"] = (u.id == current_user.id)
            results.append(u_dict)

        return jsonify(results), 200
    except Exception as e:
        return jsonify({"error": f"Database error while fetching users: {str(e)}"}), 500


# 5.3 User Management: Delete User with Self-Deletion Safeguard (Admin Only)
@app.route("/api/admin/users/<int:user_id>", methods=["DELETE"])
@token_required
@admin_required
def delete_admin_user(current_user, user_id):
    """
    Delete a user account and associated tasks/categories safely.
    Strictly forbids deleting the currently authenticated administrator.
    """
    if user_id == current_user.id:
        return jsonify({
            "error": "Security safeguard: Administrators cannot delete their own account."
        }), 400

    try:
        target_user = db.session.get(User, user_id)
    except Exception:
        return jsonify({"error": "Database error while fetching user"}), 500

    if not target_user:
        return jsonify({"error": "User not found"}), 404

    target_email = target_user.email
    try:
        db.session.delete(target_user)
        db.session.commit()
        return jsonify({
            "message": f"User '{target_email}' and all associated tasks/categories were deleted successfully."
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Database error while deleting user: {str(e)}"}), 500


# 5.4 Cross-Workspace Task Management: List All Tasks (Admin Only)
@app.route("/api/admin/tasks", methods=["GET"])
@token_required
@admin_required
def get_admin_tasks(current_user):
    """
    List tasks across all users with title/description search, status, and priority filtering.
    """
    try:
        search_query = request.args.get("q", "").strip()
        status_filter = request.args.get("status", "all").strip().lower()
        priority_filter = request.args.get("priority", "all").strip().lower()
        user_id_filter = request.args.get("user_id")

        query = Task.query
        if search_query:
            pattern = f"%{search_query}%"
            query = query.filter((Task.title.ilike(pattern)) | (Task.description.ilike(pattern)))

        if status_filter in VALID_STATUSES:
            query = query.filter_by(status=status_filter)

        if priority_filter in VALID_PRIORITIES:
            query = query.filter_by(priority=priority_filter)

        if user_id_filter:
            try:
                uid = int(user_id_filter)
                query = query.filter_by(user_id=uid)
            except ValueError:
                pass

        tasks = query.order_by(Task.created_at.desc()).all()
        results = []
        for t in tasks:
            t_dict = t.to_dict()
            t_dict["user_name"] = t.user.name if t.user else "Unknown"
            t_dict["user_email"] = t.user.email if t.user else "Unknown"
            results.append(t_dict)

        return jsonify(results), 200
    except Exception as e:
        return jsonify({"error": f"Database error while fetching tasks: {str(e)}"}), 500


# 5.5 Cross-Workspace Task Management: Update Task (Admin Only)
@app.route("/api/admin/tasks/<int:task_id>", methods=["PUT"])
@token_required
@admin_required
def update_admin_task(current_user, task_id):
    """
    Modify task status, priority, title, description or due date as administrator.
    """
    try:
        task = db.session.get(Task, task_id)
    except Exception:
        return jsonify({"error": "Database error while fetching task"}), 500

    if not task:
        return jsonify({"error": "Task not found"}), 404

    data = request.get_json(silent=True)
    if data is None or not isinstance(data, dict):
        return jsonify({"error": "Request body must be valid JSON"}), 400

    if "title" in data:
        title = data.get("title")
        if not title or not isinstance(title, str) or not title.strip():
            return jsonify({"error": "'title' must be a non-empty string"}), 400
        task.title = title.strip()

    if "description" in data:
        task.description = data.get("description")

    if "status" in data:
        status_raw = data.get("status")
        if status_raw is not None:
            if not isinstance(status_raw, str) or status_raw.lower() not in VALID_STATUSES:
                return jsonify({
                    "error": f"Invalid 'status'. Allowed values: {', '.join(sorted(VALID_STATUSES))}"
                }), 400
            task.status = status_raw.lower()

    if "priority" in data:
        priority_raw = data.get("priority")
        if priority_raw is not None:
            if not isinstance(priority_raw, str) or priority_raw.lower() not in VALID_PRIORITIES:
                return jsonify({
                    "error": f"Invalid 'priority'. Allowed values: {', '.join(sorted(VALID_PRIORITIES))}"
                }), 400
            task.priority = priority_raw.lower()

    if "due_date" in data:
        due_date_raw = data.get("due_date")
        if due_date_raw is None or due_date_raw == "":
            task.due_date = None
        else:
            try:
                task.due_date = datetime.fromisoformat(due_date_raw)
            except (ValueError, TypeError):
                return jsonify({
                    "error": "Invalid 'due_date' format. Please use ISO 8601 format."
                }), 400

    try:
        db.session.commit()
        t_dict = task.to_dict()
        t_dict["user_name"] = task.user.name if task.user else "Unknown"
        t_dict["user_email"] = task.user.email if task.user else "Unknown"
        return jsonify(t_dict), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Database error while updating task: {str(e)}"}), 500


# 5.6 Cross-Workspace Task Management: Delete Task (Admin Only)
@app.route("/api/admin/tasks/<int:task_id>", methods=["DELETE"])
@token_required
@admin_required
def delete_admin_task(current_user, task_id):
    """
    Delete any task across the system as an administrator.
    """
    try:
        task = db.session.get(Task, task_id)
    except Exception:
        return jsonify({"error": "Database error while fetching task"}), 500

    if not task:
        return jsonify({"error": "Task not found"}), 404

    task_title = task.title
    try:
        db.session.delete(task)
        db.session.commit()
        return jsonify({"message": f"Task '{task_title}' was deleted successfully by administrator."}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Database error while deleting task: {str(e)}"}), 500


if __name__ == "__main__":
    app.run(debug=True, port=5000)
