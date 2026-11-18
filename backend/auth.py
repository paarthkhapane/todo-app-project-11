import os
from datetime import datetime, timedelta, timezone
from functools import wraps
from pathlib import Path
from dotenv import load_dotenv
from flask import jsonify, request
import jwt
from werkzeug.security import check_password_hash, generate_password_hash

# Ensure root .env is loaded
ROOT_DIR = Path(__file__).resolve().parent.parent
dotenv_path = ROOT_DIR / ".env"
load_dotenv(dotenv_path=dotenv_path)

# Import models and db (no circular dependency because models.py does not import auth.py)
from models import db, User


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
