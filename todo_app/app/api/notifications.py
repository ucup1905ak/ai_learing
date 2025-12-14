from flask import Blueprint, jsonify
from flask_login import login_required, current_user
from app import db
from app.models.notification import Notification
from marshmallow import Schema, fields

notifications_bp = Blueprint('notifications', __name__)

class NotificationSchema(Schema):
    id = fields.Int()
    message = fields.Str()
    is_read = fields.Bool()
    created_at = fields.DateTime()
    task_id = fields.Int()

notifications_schema = NotificationSchema(many=True)

@notifications_bp.route('/notifications', methods=['GET'])
@login_required
def get_notifications():
    notifications = Notification.query.filter_by(user_id=current_user.id).order_by(Notification.created_at.desc()).all()
    return jsonify(notifications_schema.dump(notifications))

@notifications_bp.route('/notifications/<int:notification_id>/read', methods=['PUT'])
@login_required
def mark_read(notification_id):
    notif = Notification.query.get_or_404(notification_id)
    if notif.user_id != current_user.id:
        return jsonify({'error': 'Permission denied'}), 403
        
    notif.is_read = True
    db.session.commit()
    return jsonify({'message': 'Marked as read'})
