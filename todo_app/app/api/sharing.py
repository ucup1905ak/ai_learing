from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user
from app import db
from app.models.user import User
from app.models.shared import SharedItem
from app.models.task import Task
from app.models.event import Event

sharing_bp = Blueprint('sharing', __name__)

@sharing_bp.route('/users', methods=['GET'])
@login_required
def get_users():
    users = User.query.filter(User.id != current_user.id).all()
    return jsonify([{'id': u.id, 'username': u.username, 'email': u.email} for u in users])

@sharing_bp.route('/share', methods=['POST'])
@login_required
def share_item():
    data = request.get_json()
    item_type = data.get('item_type')
    item_id = data.get('item_id')
    shared_with_id = data.get('shared_with_id')
    permission = data.get('permission', 'view')
    
    # Verify ownership
    item = None
    if item_type in ['todo', 'task']:
        item = Task.query.filter_by(id=item_id, user_id=current_user.id).first()
        item_type = 'todo' # Standardizing on what DB expects if I want compat, or use 'task'. 
        # Existing DB uses 'todo'.
    elif item_type == 'event':
        item = Event.query.filter_by(id=item_id, user_id=current_user.id).first()
        
    if not item:
        return jsonify({'error': 'Item not found or permission denied'}), 404
        
    # Check existing
    existing = SharedItem.query.filter_by(
        item_type=item_type,
        item_id=item_id,
        shared_with_id=shared_with_id
    ).first()
    
    if existing:
        existing.permission = permission
    else:
        new_share = SharedItem(
            item_type=item_type,
            item_id=item_id,
            owner_id=current_user.id,
            shared_with_id=shared_with_id,
            permission=permission
        )
        db.session.add(new_share)
        
    db.session.commit()
    return jsonify({'message': 'Item shared successfully'})

@sharing_bp.route('/share/<int:share_id>', methods=['DELETE'])
@login_required
def unshare_item(share_id):
    share = SharedItem.query.filter_by(id=share_id, owner_id=current_user.id).first()
    if share:
        db.session.delete(share)
        db.session.commit()
    return jsonify({'message': 'Share removed'})

@sharing_bp.route('/shared/<item_type>/<int:item_id>', methods=['GET'])
@login_required
def get_shared_users(item_type, item_id):
    shares = SharedItem.query.filter_by(
        item_type=item_type,
        item_id=item_id,
        owner_id=current_user.id
    ).all()
    
    result = []
    for s in shares:
        result.append({
            'id': s.id,
            'user_id': s.shared_with.id,
            'username': s.shared_with.username,
            'email': s.shared_with.email,
            'permission': s.permission
        })
    return jsonify(result)
