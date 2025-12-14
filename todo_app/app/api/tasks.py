from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user
from app import db
from app.models.task import Task
from app.models.shared import SharedItem
from app.schemas import TaskSchema
from datetime import datetime

tasks_bp = Blueprint('tasks', __name__)
task_schema = TaskSchema()
tasks_schema = TaskSchema(many=True)

@tasks_bp.route('/tasks', methods=['GET'])
@tasks_bp.route('/todos', methods=['GET']) # Backward compatibility alias
@login_required
def get_tasks():
    # Own tasks
    own_tasks = Task.query.filter_by(user_id=current_user.id).all()
    
    # Shared tasks
    shared_items = SharedItem.query.filter_by(shared_with_id=current_user.id, item_type='todo').all() 
    # Note: 'todo' legacy type, or 'task' new type. I should check both or standardize.
    # I will standardize on 'task' for new, but keep 'todo' check if migration didn't update it.
    
    shared_task_ids = [item.item_id for item in shared_items]
    shared_tasks = Task.query.filter(Task.id.in_(shared_task_ids)).all()
    
    # Serialize
    own_data = tasks_schema.dump(own_tasks)
    shared_data = tasks_schema.dump(shared_tasks)
    
    # Add access_type
    for task in own_data:
        task['access_type'] = 'owner'
        
    for task in shared_data:
        # Find permission
        item = next((i for i in shared_items if i.item_id == task['id']), None)
        task['access_type'] = item.permission if item else 'view'
        
    return jsonify(own_data + shared_data)

@tasks_bp.route('/tasks', methods=['POST'])
@tasks_bp.route('/todos', methods=['POST'])
@login_required
def create_task():
    data = request.get_json()
    
    # Convert priority text to int if needed (legacy frontend sends 'medium')
    priority_map = {'low': 1, 'medium': 2, 'high': 3, 'urgent': 4}
    priority = data.get('priority')
    if isinstance(priority, str):
        priority = priority_map.get(priority.lower(), 2)
    
    new_task = Task(
        title=data.get('title'),
        description=data.get('description', ''),
        status=data.get('status', 'pending'),
        priority=priority or 2,
        deadline=datetime.fromisoformat(data.get('deadline')) if data.get('deadline') else None,
        user_id=current_user.id,
        parent_id=data.get('parent_id'),
        project_id=data.get('project_id')
    )
    
    db.session.add(new_task)
    db.session.commit()
    
    return task_schema.jsonify(new_task), 201

@tasks_bp.route('/tasks/<int:task_id>', methods=['PUT'])
@tasks_bp.route('/todos/<int:task_id>', methods=['PUT'])
@login_required
def update_task(task_id):
    task = Task.query.get_or_404(task_id)
    
    # Check permissions
    if task.user_id != current_user.id:
        shared = SharedItem.query.filter_by(
            item_type='todo', # or 'task'
            item_id=task_id,
            shared_with_id=current_user.id,
            permission='edit'
        ).first()
        if not shared:
            return jsonify({'error': 'Permission denied'}), 403

    data = request.get_json()
    
    if 'title' in data:
        task.title = data['title']
    if 'description' in data:
        task.description = data['description']
    if 'status' in data:
        task.status = data['status']
        if task.status == 'completed' and not task.completed_at:
            task.completed_at = datetime.utcnow()
    
    if 'priority' in data:
        priority_map = {'low': 1, 'medium': 2, 'high': 3, 'urgent': 4}
        priority = data.get('priority')
        if isinstance(priority, str):
            priority = priority_map.get(priority.lower(), 2)
        task.priority = priority
        
    if 'deadline' in data:
         task.deadline = datetime.fromisoformat(data.get('deadline')) if data.get('deadline') else None
         
    if 'parent_id' in data:
        task.parent_id = data['parent_id']

    db.session.commit()
    return task_schema.jsonify(task)

@tasks_bp.route('/tasks/<int:task_id>', methods=['DELETE'])
@tasks_bp.route('/todos/<int:task_id>', methods=['DELETE'])
@login_required
def delete_task(task_id):
    task = Task.query.filter_by(id=task_id, user_id=current_user.id).first()
    if not task:
        return jsonify({'error': 'Task not found or permission denied'}), 404
        
    # Delete shared items
    SharedItem.query.filter_by(item_type='todo', item_id=task_id).delete()
    
    db.session.delete(task)
    db.session.commit()
    
    return jsonify({'message': 'Task deleted successfully'})
