from __future__ import annotations

from flask import Blueprint, jsonify, request
from flask_login import current_user, login_required

from models import Dump, db
from utils.categorizer import categorize


dumps_bp = Blueprint("dumps", __name__, url_prefix="/api/dumps")


def _json_error(message: str, status: int):
    return jsonify({"error": message}), status


@dumps_bp.post("")
@login_required
def create_dump():
    data = request.get_json(silent=True) or {}
    raw_text = (data.get("raw_text") or "").strip()
    if not raw_text:
        return _json_error("raw_text is required.", 400)

    cat = categorize(raw_text)
    dump = Dump(
        user_id=current_user.id,
        raw_text=raw_text,
        tasks=cat["tasks"],
        ideas=cat["ideas"],
        worries=cat["worries"],
        notes=cat["notes"],
        clarity_score=cat["clarity_score"],
    )
    db.session.add(dump)
    db.session.commit()
    return jsonify({"dump": dump.to_dict()}), 201


@dumps_bp.get("")
@login_required
def list_dumps():
    search = (request.args.get("search") or "").strip()
    q = Dump.query.filter_by(user_id=current_user.id)
    if search:
        like = f"%{search}%"
        q = q.filter(Dump.raw_text.ilike(like))
    dumps = q.order_by(Dump.created_at.desc(), Dump.id.desc()).all()
    return jsonify({"dumps": [d.to_dict() for d in dumps]}), 200


@dumps_bp.get("/<int:dump_id>")
@login_required
def get_dump(dump_id: int):
    dump = Dump.query.get(dump_id)
    if not dump:
        return _json_error("Dump not found.", 404)
    if dump.user_id != current_user.id:
        return _json_error("Forbidden.", 403)
    return jsonify({"dump": dump.to_dict()}), 200


@dumps_bp.delete("/<int:dump_id>")
@login_required
def delete_dump(dump_id: int):
    dump = Dump.query.get(dump_id)
    if not dump:
        return _json_error("Dump not found.", 404)
    if dump.user_id != current_user.id:
        return _json_error("Forbidden.", 403)
    db.session.delete(dump)
    db.session.commit()
    return jsonify({"ok": True}), 200
