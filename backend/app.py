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
DB_NAME = os.getenv("DB_NAME", "taskdb")
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
from models import db, User, Task

# Initialize SQLAlchemy with the Flask app instance
db.init_app(app)


# Simple test route to verify server is running
@app.route("/", methods=["GET"])
def index():
    return jsonify({
        "status": "success",
        "message": "Flask backend is running"
    })


# Task Creation API Endpoint
@app.route("/api/tasks", methods=["POST"])
def create_task():
    # 1. Read JSON request body
    data = request.get_json(silent=True)
    if data is None or not isinstance(data, dict):
        return jsonify({"error": "Request body must be valid JSON"}), 400

    # 2. Validate required fields: user_id and title
    user_id = data.get("user_id")
    title = data.get("title")

    if user_id is None:
        return jsonify({"error": "'user_id' is required"}), 400

    if not isinstance(user_id, int):
        return jsonify({"error": "'user_id' must be an integer"}), 400

    if not title or not isinstance(title, str) or not title.strip():
        return jsonify({"error": "'title' is required and cannot be empty"}), 400

    # 3. Read optional fields
    description = data.get("description")
    status = data.get("status")
    priority = data.get("priority")
    due_date_raw = data.get("due_date")

    # Parse optional due_date
    due_date = None
    if due_date_raw:
        try:
            due_date = datetime.fromisoformat(due_date_raw)
        except (ValueError, TypeError):
            return jsonify({
                "error": "Invalid 'due_date' format. Please use ISO 8601 format (e.g., YYYY-MM-DD or YYYY-MM-DDTHH:MM:SS)"
            }), 400

    # 4. Instantiate Task object (use model defaults if status or priority are omitted)
    task = Task(
        user_id=user_id,
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
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Database error while creating task"}), 500


# Task Retrieval API Endpoint (All tasks)
@app.route("/api/tasks", methods=["GET"])
def get_tasks():
    try:
        tasks = Task.query.all()
        return jsonify([task.to_dict() for task in tasks]), 200
    except Exception as e:
        return jsonify({"error": "Database error while fetching tasks"}), 500


# Single Task Retrieval API Endpoint
@app.route("/api/tasks/<int:task_id>", methods=["GET"])
def get_task(task_id):
    try:
        task = db.session.get(Task, task_id)
        if not task:
            return jsonify({"error": "Task not found"}), 404
        return jsonify(task.to_dict()), 200
    except Exception as e:
        return jsonify({"error": "Database error while fetching task"}), 500


# Task Update API Endpoint
@app.route("/api/tasks/<int:task_id>", methods=["PUT"])
def update_task(task_id):
    # 1. Find the existing task by ID
    try:
        task = db.session.get(Task, task_id)
    except Exception as e:
        return jsonify({"error": "Database error while fetching task"}), 500

    if not task:
        return jsonify({"error": "Task not found"}), 404

    # 2. Read and validate JSON request body
    data = request.get_json(silent=True)
    if data is None or not isinstance(data, dict):
        return jsonify({"error": "Request body must be valid JSON"}), 400

    # 3. Validate and update 'title' if provided
    if "title" in data:
        title = data.get("title")
        if not title or not isinstance(title, str) or not title.strip():
            return jsonify({"error": "'title' must be a non-empty string"}), 400
        task.title = title.strip()

    # 4. Update 'description' if provided
    if "description" in data:
        task.description = data.get("description")

    # 5. Update 'status' if provided
    if "status" in data:
        status = data.get("status")
        if status is not None and not isinstance(status, str):
            return jsonify({"error": "'status' must be a string"}), 400
        task.status = status

    # 6. Update 'priority' if provided
    if "priority" in data:
        priority = data.get("priority")
        if priority is not None and not isinstance(priority, str):
            return jsonify({"error": "'priority' must be a string"}), 400
        task.priority = priority

    # 7. Validate and update 'due_date' if provided
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

    # user_id is deliberately not modified

    # 8. Commit changes to the database
    try:
        db.session.commit()
        return jsonify(task.to_dict()), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Database error while updating task"}), 500


# Task Deletion API Endpoint
@app.route("/api/tasks/<int:task_id>", methods=["DELETE"])
def delete_task(task_id):
    # 1. Find the existing task by ID
    try:
        task = db.session.get(Task, task_id)
    except Exception as e:
        return jsonify({"error": "Database error while fetching task"}), 500

    if not task:
        return jsonify({"error": "Task not found"}), 404

    # 2. Delete the task and commit transaction
    try:
        db.session.delete(task)
        db.session.commit()
        return jsonify({"message": "Task deleted successfully"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Database error while deleting task"}), 500


if __name__ == "__main__":
    app.run(debug=True)
