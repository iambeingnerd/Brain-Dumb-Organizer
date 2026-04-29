from __future__ import annotations

import re
from datetime import timedelta

from flask import Blueprint, current_app, jsonify, request
from flask_login import current_user, login_required, login_user, logout_user
from itsdangerous import BadSignature, SignatureExpired, URLSafeTimedSerializer

from models import User, db


auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")


EMAIL_RE = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")


def _json_error(message: str, status: int):
    return jsonify({"error": message}), status


def _serializer() -> URLSafeTimedSerializer:
    return URLSafeTimedSerializer(secret_key=current_app.config["SECRET_KEY"], salt="mindvault-auth")


def _make_token(user: User) -> str:
    # Token is returned for UX parity with the prompt; session cookies are the actual auth mechanism.
    return _serializer().dumps({"user_id": user.id})


def _verify_token(token: str, max_age_seconds: int = 60 * 60 * 24 * 7) -> dict | None:
    try:
        return _serializer().loads(token, max_age=max_age_seconds)
    except (BadSignature, SignatureExpired):
        return None


@auth_bp.post("/register")
def register():
    data = request.get_json(silent=True) or {}
    username = (data.get("username") or "").strip()
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""

    if not (3 <= len(username) <= 20):
        return _json_error("Username must be 3–20 characters.", 400)
    if not EMAIL_RE.match(email):
        return _json_error("Invalid email address.", 400)
    if len(password) < 6:
        return _json_error("Password must be at least 6 characters.", 400)

    if User.query.filter_by(username=username).first() is not None:
        return _json_error("Username already taken.", 400)
    if User.query.filter_by(email=email).first() is not None:
        return _json_error("Email already registered.", 400)

    user = User(username=username, email=email)
    user.set_password(password)
    db.session.add(user)
    db.session.commit()

    login_user(user, remember=True, duration=timedelta(days=7))
    return jsonify({"token": _make_token(user), "user": user.to_public_dict()}), 201


@auth_bp.post("/login")
def login():
    data = request.get_json(silent=True) or {}
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""

    if not EMAIL_RE.match(email):
        return _json_error("Invalid email address.", 400)
    if not password:
        return _json_error("Password is required.", 400)

    user = User.query.filter_by(email=email).first()
    if user is None or not user.check_password(password):
        return _json_error("Invalid credentials.", 401)

    login_user(user, remember=True, duration=timedelta(days=7))
    return jsonify({"token": _make_token(user), "user": user.to_public_dict()}), 200


@auth_bp.post("/logout")
def logout():
    if current_user.is_authenticated:
        logout_user()
    return jsonify({"ok": True}), 200


@auth_bp.get("/me")
@login_required
def me():
    return jsonify({"user": current_user.to_public_dict()}), 200


@auth_bp.post("/token_login")
def token_login():
    # Not used by the frontend, but kept deterministic & fully implemented.
    data = request.get_json(silent=True) or {}
    token = data.get("token") or ""
    payload = _verify_token(token)
    if not payload or "user_id" not in payload:
        return _json_error("Invalid token.", 401)
    user = User.query.get(int(payload["user_id"]))
    if not user:
        return _json_error("User not found.", 404)
    login_user(user, remember=True, duration=timedelta(days=7))
    return jsonify({"user": user.to_public_dict()}), 200
