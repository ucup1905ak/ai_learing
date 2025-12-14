from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user
from app import db
from app.models.task import ChecklistItem, Task
from marshmallow import Schema, fields

checklists_bp = Blueprint('checklists', __name__)

class ChecklistItemSchema(Schema):
    id = fields.Int()
    content = fields.Str()
    is_completed = fields.Bool()
    task_id = fields.Int()

checklist_schema = ChecklistItemSchema()
checklists_schema = ChecklistItemSchema(many=True)

@checklists_bp.route('/tasks/<int:task_id>/checklist', methods=['GET'])
@login_required
def get_checklist(task_id):
    items = ChecklistItem.query.filter_by(task_id=task_id).all()
    return jsonify(checklists_schema.dump(items))

@checklists_bp.route('/tasks/<int:task_id>/checklist', methods=['POST'])
@login_required
def add_checklist_item(task_id):
    data = request.get_json()
    content = data.get('content')
    
    if not content:
        return jsonify({'error': 'Content is required'}), 400
        
    task = Task.query.get_or_404(task_id)
    # Check permissions...
    
    item = ChecklistItem(
        task_id=task_id,
        content=content,
        is_completed=False
    )
    db.session.add(item)
    db.session.commit()
    return checklist_schema.jsonify(item), 201

@checklists_bp.route('/checklist/<int:item_id>', methods=['PUT'])
@login_required
def update_checklist_item(item_id):
    item = ChecklistItem.query.get_or_404(item_id)
    data = request.get_json()
    
    if 'is_completed' in data:
        item.is_completed = data['is_completed']
    if 'content' in data:
        item.content = data['content']
        
    db.session.commit()
    return checklist_schema.jsonify(item)

@checklists_bp.route('/checklist/<int:item_id>', methods=['DELETE'])
@login_required
def delete_checklist_item(item_id):
    item = ChecklistItem.query.get_or_404(item_id)
    db.session.delete(item)
    db.session.commit()
    return jsonify({'message': 'Item deleted'})
