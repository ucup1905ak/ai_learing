from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user
from app import db
from app.models.project import Project
from app.schemas import ProjectSchema

projects_bp = Blueprint('projects', __name__)
project_schema = ProjectSchema()
projects_schema = ProjectSchema(many=True)

@projects_bp.route('/projects', methods=['GET'])
@login_required
def get_projects():
    projects = Project.query.filter_by(owner_id=current_user.id).all()
    return projects_schema.jsonify(projects)

@projects_bp.route('/projects', methods=['POST'])
@login_required
def create_project():
    data = request.get_json()
    new_project = Project(
        title=data.get('title'),
        description=data.get('description'),
        color=data.get('color', '#00f3ff'),
        owner_id=current_user.id
    )
    db.session.add(new_project)
    db.session.commit()
    return project_schema.jsonify(new_project), 201

@projects_bp.route('/projects/<int:project_id>', methods=['PUT'])
@login_required
def update_project(project_id):
    project = Project.query.get_or_404(project_id)
    if project.owner_id != current_user.id:
        return jsonify({'error': 'Permission denied'}), 403

    data = request.get_json()
    project.title = data.get('title', project.title)
    project.description = data.get('description', project.description)
    project.color = data.get('color', project.color)
    db.session.commit()
    return project_schema.jsonify(project)

@projects_bp.route('/projects/<int:project_id>', methods=['DELETE'])
@login_required
def delete_project(project_id):
    project = Project.query.get_or_404(project_id)
    if project.owner_id != current_user.id:
        return jsonify({'error': 'Permission denied'}), 403

    # Disassociate tasks first
    for task in project.tasks:
        task.project_id = None
    
    db.session.delete(project)
    db.session.commit()
    return jsonify({'message': 'Project deleted successfully'})
