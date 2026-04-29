from __future__ import annotations

from datetime import datetime, timezone

from flask_login import UserMixin
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import check_password_hash, generate_password_hash


db = SQLAlchemy()


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class User(UserMixin, db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(20), unique=True, nullable=False, index=True)
    email = db.Column(db.String(254), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, nullable=False, default=utcnow)

    dumps = db.relationship("Dump", back_populates="user", cascade="all, delete-orphan")

    def set_password(self, password: str) -> None:
        self.password_hash = generate_password_hash(password)

    def check_password(self, password: str) -> bool:
        return check_password_hash(self.password_hash, password)

    def to_public_dict(self) -> dict:
        return {
            "id": self.id,
            "username": self.username,
            "email": self.email,
            "created_at": self.created_at.isoformat(),
        }


class Dump(db.Model):
    __tablename__ = "dumps"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    raw_text = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, nullable=False, default=utcnow, index=True)

    tasks = db.Column(db.JSON, nullable=False, default=list)
    ideas = db.Column(db.JSON, nullable=False, default=list)
    worries = db.Column(db.JSON, nullable=False, default=list)
    notes = db.Column(db.JSON, nullable=False, default=list)
    clarity_score = db.Column(db.Integer, nullable=False, default=50)

    user = db.relationship("User", back_populates="dumps")

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "user_id": self.user_id,
            "raw_text": self.raw_text,
            "created_at": self.created_at.isoformat(),
            "tasks": self.tasks or [],
            "ideas": self.ideas or [],
            "worries": self.worries or [],
            "notes": self.notes or [],
            "clarity_score": int(self.clarity_score or 0),
        }
