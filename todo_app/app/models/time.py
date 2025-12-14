from app import db
from datetime import datetime

class TimeEntry(db.Model):
    __tablename__ = 'time_entries'

    id = db.Column(db.Integer, primary_key=True)
    task_id = db.Column(db.Integer, db.ForeignKey('tasks.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    
    start_time = db.Column(db.DateTime, nullable=False)
    end_time = db.Column(db.DateTime) # Null if currently running
    duration = db.Column(db.Integer) # Duration in seconds, populated on stop
    
    description = db.Column(db.String(255))
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    task = db.relationship('Task', backref=db.backref('time_entries', lazy='dynamic'))
    user = db.relationship('User', backref=db.backref('time_entries', lazy='dynamic'))

    def __repr__(self):
        return f'<TimeEntry {self.id} for Task {self.task_id}>'
