"""
FlowTask - Authentication & JWT Middleware
Handles password hashing, JWT generation/verification, and route protection.
"""

import os
import sys
from datetime import datetime, timedelta, timezone
from functools import wraps
from pathlib import Path
from flask import jsonify, request
from werkzeug.security import check_password_hash, generate_password_hash

# Ensure backend directory is in sys.path
BACKEND_DIR = Path(__file__).resolve().parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

# Ensure root .env is loaded
ROOT_DIR = BACKEND_DIR.parent
dotenv_path = ROOT_DIR / ".env"
try:
    from dotenv import load_dotenv
    load_dotenv(dotenv_path=dotenv_path)
except ImportError:
    pass

try:
    import jwt
except ImportError:
    jwt = None

# Import models and db (handles both backend directory and package imports)
try:
    from models import db, User
except ImportError:
    from backend.models import db, User


def get_jwt_secret_key():
    """
    Retrieve JWT_SECRET_KEY from environment variables.
    Fails clearly if JWT_SECRET_KEY is not configured in .env.
    """
    secret = os.getenv("JWT_SECRET_KEY")
    if not secret:
        raise ValueError(
            "JWT_SECRET_KEY is not set. Please set JWT_SECRET_KEY in the root .env file."
        )
    return secret


def hash_password(password):
    """Hash plaintext password using werkzeug.security."""
    return generate_password_hash(password)


def verify_password(password_hash, password):
    """Verify password against stored password hash."""
    return check_password_hash(password_hash, password)


def generate_token(user_id, role, expires_in_hours=24):
    """
    Generate a signed JWT token containing user_id, role, and expiration timestamp.
    """
    if jwt is None:
        raise RuntimeError("PyJWT is not installed. Please run 'pip install -r requirements.txt'.")
    secret = get_jwt_secret_key()
    payload = {
        "user_id": user_id,
        "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(hours=expires_in_hours)
    }
    return jwt.encode(payload, secret, algorithm="HS256")


def decode_token(token):
    """
    Decode and verify a JWT token.
    Raises jwt.ExpiredSignatureError, jwt.InvalidTokenError, or ValueError.
    """
    if jwt is None:
        raise RuntimeError("PyJWT is not installed. Please run 'pip install -r requirements.txt'.")
    secret = get_jwt_secret_key()
    return jwt.decode(token, secret, algorithms=["HS256"])


def token_required(f):
    """
    Decorator to protect routes with JWT authentication.
    Reads Authorization: Bearer <token>, verifies signature and expiration,
    retrieves the User from the database, and passes current_user to the route.
    """
    @wraps(f)
    def decorated(*args, **kwargs):
        if jwt is None:
            return jsonify({
                "error": "PyJWT is not installed on the server. Please run 'pip install -r requirements.txt'."
            }), 500

        auth_header = request.headers.get("Authorization")
        if not auth_header:
            return jsonify({"error": "Authorization header is missing"}), 401

        parts = auth_header.split()
        if len(parts) != 2 or parts[0].lower() != "bearer":
            return jsonify({
                "error": "Invalid Authorization header format. Expected 'Bearer <token>'"
            }), 401

        token = parts[1]
        try:
            payload = decode_token(token)
            user_id = payload.get("user_id")
        except jwt.ExpiredSignatureError:
            return jsonify({"error": "Token has expired"}), 401
        except jwt.InvalidTokenError:
            return jsonify({"error": "Invalid token"}), 401
        except ValueError as e:
            return jsonify({"error": str(e)}), 500

        try:
            current_user = db.session.get(User, user_id)
        except Exception:
            return jsonify({"error": "Database error while validating user"}), 500

        if not current_user:
            return jsonify({"error": "User not found or no longer active"}), 401

        return f(current_user, *args, **kwargs)

    return decorated


def admin_required(f):
    """
    Decorator to protect routes requiring administrator privileges.
    Must be stacked after @token_required:
        @app.route(...)
        @token_required
        @admin_required
        def admin_view(current_user):
            ...
    Verifies that the authenticated current_user has role == 'admin'.
    Returns 403 Forbidden if the user is not an administrator.
    """
    @wraps(f)
    def decorated(current_user, *args, **kwargs):
        if not current_user or getattr(current_user, "role", None) != "admin":
            return jsonify({
                "error": "Access forbidden: administrator privileges required"
            }), 403

        return f(current_user, *args, **kwargs)

    return decorated
