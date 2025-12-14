from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user
from app import db
from app.models.time import TimeEntry
from app.models.task import Task
from marshmallow import Schema, fields
from datetime import datetime

time_bp = Blueprint('time', __name__)

class TimeEntrySchema(Schema):
    id = fields.Int()
    start_time = fields.DateTime()
    end_time = fields.DateTime()
    duration = fields.Int()
    description = fields.Str()

time_schema = TimeEntrySchema()
times_schema = TimeEntrySchema(many=True)

@time_bp.route('/tasks/<int:task_id>/time', methods=['GET'])
@login_required
def get_time_entries(task_id):
    entries = TimeEntry.query.filter_by(task_id=task_id).all()
    return jsonify(times_schema.dump(entries))

@time_bp.route('/tasks/<int:task_id>/time/start', methods=['POST'])
@login_required
def start_timer(task_id):
    # Check if already running for user
    active = TimeEntry.query.filter_by(user_id=current_user.id, end_time=None).first()
    if active:
        return jsonify({'error': 'Timer already running for another task'}), 400
        
    entry = TimeEntry(
        task_id=task_id,
        user_id=current_user.id,
        start_time=datetime.utcnow()
    )
    db.session.add(entry)
    db.session.commit()
    return time_schema.jsonify(entry), 201

@time_bp.route('/tasks/<int:task_id>/time/stop', methods=['POST'])
@login_required
def stop_timer(task_id):
    entry = TimeEntry.query.filter_by(user_id=current_user.id, task_id=task_id, end_time=None).first()
    if not entry:
        return jsonify({'error': 'No active timer for this task'}), 404
        
    entry.end_time = datetime.utcnow()
    entry.duration = int((entry.end_time - entry.start_time).total_seconds())
    
    db.session.commit()
    return time_schema.jsonify(entry)
