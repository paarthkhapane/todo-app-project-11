"""
FlowTask - Secure Local CLI Admin Provisioning Utility (Phase 3)
Allows creating a new administrator account or promoting an existing user
to administrator securely via command-line interface.

Usage:
  python backend/create_admin.py --email admin@example.com --password SecretPassword123! --name "System Administrator"
  python backend/create_admin.py --promote --email user@example.com
"""

import argparse
import getpass
import os
import re
import sys
from pathlib import Path

# Ensure root directory and backend directory are in sys.path
BACKEND_DIR = Path(__file__).resolve().parent
ROOT_DIR = BACKEND_DIR.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

# Load .env configuration
dotenv_path = ROOT_DIR / ".env"
try:
    from dotenv import load_dotenv
    load_dotenv(dotenv_path=dotenv_path)
except ImportError:
    pass

try:
    from app import app
    from models import db, User
    from auth import hash_password
except ImportError:
    from backend.app import app
    from backend.models import db, User
    from backend.auth import hash_password


EMAIL_REGEX = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


def validate_email(email):
    """Validate email syntax."""
    if not email or not isinstance(email, str):
        return False
    return bool(EMAIL_REGEX.match(email.strip()))


def create_or_promote_admin(email, password=None, name="System Administrator", promote_only=False):
    """
    Programmatic helper to create or promote an admin user.
    Returns (success: bool, message: str, user_dict: dict | None)
    """
    if not validate_email(email):
        return False, "Invalid email address format.", None

    clean_email = email.strip().lower()

    with app.app_context():
        try:
            existing_user = User.query.filter_by(email=clean_email).first()
        except Exception as e:
            return False, f"Database query error: {str(e)}", None

        if existing_user:
            if existing_user.role == "admin":
                return True, f"User '{clean_email}' is already an administrator.", existing_user.to_dict()

            # Promote existing user
            try:
                existing_user.role = "admin"
                db.session.commit()
                return True, f"User '{clean_email}' was successfully promoted to administrator.", existing_user.to_dict()
            except Exception as e:
                db.session.rollback()
                return False, f"Database error while promoting user: {str(e)}", None

        if promote_only:
            return False, f"User '{clean_email}' not found. Cannot promote non-existent user.", None

        # Create new admin user
        if not password or len(password) < 8:
            return False, "Password must be at least 8 characters long for an administrator account.", None

        hashed = hash_password(password)
        new_admin = User(
            name=name.strip() if name else "System Administrator",
            email=clean_email,
            password_hash=hashed,
            role="admin"
        )

        try:
            db.session.add(new_admin)
            db.session.commit()
            return True, f"Administrator '{clean_email}' created successfully.", new_admin.to_dict()
        except Exception as e:
            db.session.rollback()
            return False, f"Database error while creating administrator: {str(e)}", None


def main():
    parser = argparse.ArgumentParser(
        description="FlowTask Admin Account Provisioning Utility - Secure Local CLI"
    )
    parser.add_argument("--email", help="Administrator email address (prompted interactively if omitted)")
    parser.add_argument(
        "--password",
        help="Administrator password (optional flag; if omitted, securely prompted via getpass without echoing)"
    )
    parser.add_argument("--name", default="System Administrator", help="Administrator full name")
    parser.add_argument("--promote", action="store_true", help="Promote an existing registered user to administrator")

    args = parser.parse_args()

    # 1. Resolve email
    email = args.email
    if not email:
        try:
            email = input("Enter administrator email: ").strip()
        except (KeyboardInterrupt, EOFError):
            print("\nOperation cancelled.")
            sys.exit(1)

    if not email:
        print("[ERROR] Email address is required.", file=sys.stderr)
        sys.exit(1)

    # 2. Resolve password if creating a new administrator
    password = args.password
    if not args.promote:
        if not password:
            # Check environment variable as non-history fallback
            password = os.getenv("FLOWTASK_ADMIN_PASSWORD")

        if not password:
            try:
                pwd1 = getpass.getpass("Enter administrator password (min 8 characters): ")
                pwd2 = getpass.getpass("Confirm administrator password: ")
                if pwd1 != pwd2:
                    print("[ERROR] Passwords do not match. Provisioning aborted.", file=sys.stderr)
                    sys.exit(1)
                password = pwd1
            except (KeyboardInterrupt, EOFError):
                print("\nOperation cancelled.")
                sys.exit(1)

        if not password or len(password) < 8:
            print("[ERROR] Password must be at least 8 characters long for an administrator account.", file=sys.stderr)
            sys.exit(1)

    # 3. Create or promote administrator
    success, message, user_dict = create_or_promote_admin(
        email=email,
        password=password,
        name=args.name,
        promote_only=args.promote
    )

    if success:
        print(f"[SUCCESS] {message}")
        if user_dict:
            print(f"  User ID: {user_dict['id']}")
            print(f"  Name:    {user_dict['name']}")
            print(f"  Email:   {user_dict['email']}")
            print(f"  Role:    {user_dict['role']}")
        sys.exit(0)
    else:
        print(f"[ERROR] {message}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
