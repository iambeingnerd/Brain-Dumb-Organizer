from __future__ import annotations

import os

from flask import Flask, jsonify
from flask_cors import CORS
from flask_login import LoginManager

from config import Config
from models import User, db
from routes.auth import auth_bp
from routes.dumps import dumps_bp


def create_app() -> Flask:
    # Serve the vanilla frontend from the backend origin to avoid
    # file:// and cross-origin cookie issues with session-based auth.
    frontend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "frontend"))
    app = Flask(
        __name__,
        static_folder=frontend_dir,
        static_url_path="",
    )
    app.config.from_object(Config)

    CORS(
        app,
        supports_credentials=True,
        origins=app.config.get("CORS_ALLOWED_ORIGINS", ["http://127.0.0.1", "http://localhost", "null"]),
    )

    db.init_app(app)

    login_manager = LoginManager()
    login_manager.init_app(app)

    @login_manager.user_loader
    def load_user(user_id: str):
        try:
            return User.query.get(int(user_id))
        except Exception:
            return None

    with app.app_context():
        db.create_all()

    app.register_blueprint(auth_bp)
    app.register_blueprint(dumps_bp)

    @app.get("/")
    def root():
        return app.send_static_file("index.html")

    @app.get("/dashboard")
    def dashboard():
        return app.send_static_file("dashboard.html")

    @app.get("/api")
    def api_root():
        return jsonify({"name": "MindVault API", "ok": True}), 200

    @app.get("/favicon.ico")
    def favicon():
        # Let browsers request it without log noise. If you add an icon later,
        # place `favicon.ico` in `frontend/` and this will serve it automatically.
        try:
            return app.send_static_file("favicon.ico")
        except Exception:
            return ("", 204)

    return app


app = create_app()


if __name__ == "__main__":
    app.run(port=5000, debug=True)
