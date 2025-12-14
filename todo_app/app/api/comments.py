from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user
from app import db
from app.models.comment import Comment
from app.models.task import Task
from app.models.user import User
from app.models.notification import Notification
from app.schemas import UserSchema
from marshmallow import Schema, fields
import re

comments_bp = Blueprint('comments', __name__)

class CommentSchema(Schema):
    id = fields.Int()
    content = fields.Str()
    created_at = fields.DateTime()
    user = fields.Nested(UserSchema(only=('id', 'username')))

comment_schema = CommentSchema()
comments_schema = CommentSchema(many=True)

@comments_bp.route('/tasks/<int:task_id>/comments', methods=['GET'])
@login_required
def get_task_comments(task_id):
    comments = Comment.query.filter_by(task_id=task_id).order_by(Comment.created_at.desc()).all()
    return jsonify(comments_schema.dump(comments))

@comments_bp.route('/tasks/<int:task_id>/comments', methods=['POST'])
@login_required
def create_comment(task_id):
    data = request.get_json()
    content = data.get('content')
    
    if not content:
        return jsonify({'error': 'Content is required'}), 400
        
    task = Task.query.get_or_404(task_id)
    
    # Create comment
    comment = Comment(
        content=content,
        user_id=current_user.id,
        task_id=task_id
    )
    db.session.add(comment)
    
    # Mention logic
    mentions = re.findall(r'@(\w+)', content)
    for username in set(mentions):
        user = User.query.filter_by(username=username).first()
        if user and user.id != current_user.id:
            notification = Notification(
                message=f"{current_user.username} mentioned you in a comment on task '{task.title}'",
                user_id=user.id,
                task_id=task_id
            )
            db.session.add(notification)
            
    db.session.commit()
    
    return comment_schema.jsonify(comment), 201

@comments_bp.route('/comments/<int:comment_id>', methods=['DELETE'])
@login_required
def delete_comment(comment_id):
    comment = Comment.query.get_or_404(comment_id)
    if comment.user_id != current_user.id:
        return jsonify({'error': 'Permission denied'}), 403
        
    db.session.delete(comment)
    db.session.commit()
    return jsonify({'message': 'Comment deleted'})
