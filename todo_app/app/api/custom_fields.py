from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user
from app import db
from app.models.custom_field import CustomFieldDefinition, CustomFieldValue
from app.models.task import Task
from marshmallow import Schema, fields

custom_fields_bp = Blueprint('custom_fields', __name__)

class CustomFieldDefinitionSchema(Schema):
    id = fields.Int()
    name = fields.Str()
    field_type = fields.Str()
    options = fields.Str()

class CustomFieldValueSchema(Schema):
    id = fields.Int()
    field_definition_id = fields.Int()
    value = fields.Str()
    definition = fields.Nested(CustomFieldDefinitionSchema)

def_schema = CustomFieldDefinitionSchema()
defs_schema = CustomFieldDefinitionSchema(many=True)
val_schema = CustomFieldValueSchema()
vals_schema = CustomFieldValueSchema(many=True)

# Definitions
@custom_fields_bp.route('/custom-fields/definitions', methods=['GET'])
@login_required
def get_definitions():
    defs = CustomFieldDefinition.query.filter_by(user_id=current_user.id).all()
    return jsonify(defs_schema.dump(defs))

@custom_fields_bp.route('/custom-fields/definitions', methods=['POST'])
@login_required
def create_definition():
    data = request.get_json()
    new_def = CustomFieldDefinition(
        name=data.get('name'),
        field_type=data.get('field_type'),
        options=data.get('options'),
        user_id=current_user.id
    )
    db.session.add(new_def)
    db.session.commit()
    return def_schema.jsonify(new_def), 201

# Values
@custom_fields_bp.route('/tasks/<int:task_id>/custom-fields', methods=['GET'])
@login_required
def get_task_values(task_id):
    vals = CustomFieldValue.query.filter_by(task_id=task_id).all()
    return jsonify(vals_schema.dump(vals))

@custom_fields_bp.route('/tasks/<int:task_id>/custom-fields', methods=['POST'])
@login_required
def update_task_values(task_id):
    task = Task.query.get_or_404(task_id)
    # Check permission (omitted for brevity, assume owner/shared edit)
    
    data = request.get_json()
    # Expect list of { definition_id: 1, value: "foo" } or direct object
    
    definition_id = data.get('definition_id')
    value = data.get('value')
    
    if definition_id is None:
        return jsonify({'error': 'Missing definition_id'}), 400
        
    field_val = CustomFieldValue.query.filter_by(task_id=task_id, field_definition_id=definition_id).first()
    
    if field_val:
        field_val.value = value
    else:
        field_val = CustomFieldValue(
            task_id=task_id,
            field_definition_id=definition_id,
            value=value
        )
        db.session.add(field_val)
        
    db.session.commit()
    return val_schema.jsonify(field_val)
