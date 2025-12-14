from app import db
from datetime import datetime

class CustomFieldDefinition(db.Model):
    __tablename__ = 'custom_field_definitions'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    field_type = db.Column(db.String(20), nullable=False) # 'text', 'number', 'date', 'select'
    options = db.Column(db.Text) # For 'select' type, comma-separated options
    
    # Ownership (Global for now, or per user/project)
    # For simplicity in this iteration, let's make them per-user (so users can define their own fields)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f'<CustomFieldDef {self.name}>'

class CustomFieldValue(db.Model):
    __tablename__ = 'custom_field_values'

    id = db.Column(db.Integer, primary_key=True)
    
    task_id = db.Column(db.Integer, db.ForeignKey('tasks.id'), nullable=False)
    field_definition_id = db.Column(db.Integer, db.ForeignKey('custom_field_definitions.id'), nullable=False)
    
    value = db.Column(db.Text)
    
    # Relationships
    definition = db.relationship('CustomFieldDefinition')
    task = db.relationship('Task', backref=db.backref('custom_fields', lazy='dynamic'))

    def __repr__(self):
        return f'<CustomFieldValue {self.value}>'
