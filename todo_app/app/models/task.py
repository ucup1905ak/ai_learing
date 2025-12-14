from app import db
from datetime import datetime

# Association table for dependencies
task_dependencies = db.Table('task_dependencies',
    db.Column('blocker_id', db.Integer, db.ForeignKey('tasks.id'), primary_key=True),
    db.Column('blocked_id', db.Integer, db.ForeignKey('tasks.id'), primary_key=True)
)

class Task(db.Model):
    __tablename__ = 'tasks'

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    status = db.Column(db.String(20), default='pending') # pending, in_progress, completed, archived
    priority = db.Column(db.Integer, default=2) # 1=Low, 2=Medium, 3=High, 4=Urgent
    deadline = db.Column(db.DateTime)
    completed_at = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Ownership
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    project_id = db.Column(db.Integer, db.ForeignKey('projects.id'), nullable=True)
    
    # Hierarchy
    parent_id = db.Column(db.Integer, db.ForeignKey('tasks.id'), nullable=True)
    order = db.Column(db.Integer, default=0)

    # Relationships
    subtasks = db.relationship('Task', 
        backref=db.backref('parent', remote_side=[id]),
        lazy='dynamic',
        cascade='all, delete-orphan'
    )
    
    blocked_by = db.relationship('Task',
        secondary=task_dependencies,
        primaryjoin=(id == task_dependencies.c.blocked_id),
        secondaryjoin=(id == task_dependencies.c.blocker_id),
        backref=db.backref('blocking', lazy='dynamic'),
        lazy='dynamic'
    )
    
    checklists = db.relationship('ChecklistItem', backref='task', lazy='dynamic', cascade='all, delete-orphan')

    def __repr__(self):
        return f'<Task {self.title}>'

class ChecklistItem(db.Model):
    __tablename__ = 'checklist_items'
    
    id = db.Column(db.Integer, primary_key=True)
    task_id = db.Column(db.Integer, db.ForeignKey('tasks.id'), nullable=False)
    content = db.Column(db.String(200), nullable=False)
    is_completed = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def __repr__(self):
        return f'<ChecklistItem {self.content}>'
