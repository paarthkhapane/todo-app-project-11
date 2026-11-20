"""
FlowTask - SQLAlchemy Data Models
Defines User, Category, and Task models for the To-Do application.
Maps directly to MySQL tables in database/schema.sql.
"""

from datetime import datetime

try:
    from flask_sqlalchemy import SQLAlchemy
    db = SQLAlchemy()
except ImportError:
    # Graceful fallback when Flask-SQLAlchemy is not installed in the environment
    class _MockColumn:
        def __init__(self, *args, **kwargs):
            pass

    class _MockQuery:
        def filter_by(self, **kwargs):
            return self

        def first(self):
            return None

        def all(self):
            return []

    class _MockSession:
        def get(self, model, ident):
            return None

        def add(self, obj):
            pass

        def flush(self):
            pass

        def commit(self):
            pass

        def rollback(self):
            pass

        def delete(self, obj):
            pass

    class _MockDB:
        Model = object
        session = _MockSession()

        def Column(self, *args, **kwargs):
            return _MockColumn(*args, **kwargs)

        def Integer(self, *args, **kwargs):
            return _MockColumn()

        def String(self, *args, **kwargs):
            return _MockColumn()

        def Text(self, *args, **kwargs):
            return _MockColumn()

        def DateTime(self, *args, **kwargs):
            return _MockColumn()

        def ForeignKey(self, *args, **kwargs):
            return _MockColumn()

        def relationship(self, *args, **kwargs):
            return []

        def init_app(self, app):
            pass

    db = _MockDB()


class User(db.Model):
    """
    User model representing registered users in the To-Do application.
    """
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(255), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    role = db.Column(db.String(20), nullable=False, default="user")

    # One-to-many relationship: A user can have many tasks
    tasks = db.relationship("Task", backref="user", lazy=True, cascade="all, delete-orphan")
    # One-to-many relationship: A user can have many categories
    categories = db.relationship("Category", backref="user", lazy=True, cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "email": self.email,
            "role": self.role,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }

    def __repr__(self):
        return f"<User {self.email}>"


class Category(db.Model):
    """
    Category model representing task categories created by users.
    Maps directly to the existing 'categories' table in database/schema.sql.
    """
    __tablename__ = "categories"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    # One-to-many relationship: A category can have many tasks
    tasks = db.relationship("Task", backref="category", lazy=True)

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "name": self.name,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }

    def __repr__(self):
        return f"<Category {self.name}>"


class Task(db.Model):
    """
    Task model representing to-do tasks created by users.
    Maps directly to the existing 'tasks' table in database/schema.sql.
    """
    __tablename__ = "tasks"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    category_id = db.Column(db.Integer, db.ForeignKey("categories.id"), nullable=True)
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text, nullable=True)
    status = db.Column(db.String(50), nullable=False, default="pending")
    priority = db.Column(db.String(20), nullable=False, default="medium")
    due_date = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=True)

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "category_id": self.category_id,
            "category": self.category.name if self.category else None,
            "title": self.title,
            "description": self.description,
            "status": self.status,
            "priority": self.priority,
            "due_date": self.due_date.isoformat() if self.due_date else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }

    def __repr__(self):
        return f"<Task {self.title}>"
