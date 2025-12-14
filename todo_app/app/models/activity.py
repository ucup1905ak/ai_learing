from app import db
from datetime import datetime

class ActivityLog(db.Model):
    __tablename__ = 'activity_logs'

    id = db.Column(db.Integer, primary_key=True)
    action = db.Column(db.String(50), nullable=False) # e.g., 'created', 'updated', 'deleted', 'commented'
    details = db.Column(db.String(255))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    task_id = db.Column(db.Integer, db.ForeignKey('tasks.id'), nullable=True)
    event_id = db.Column(db.Integer, db.ForeignKey('events.id'), nullable=True)

    # Relationships
    user = db.relationship('User', backref=db.backref('activities', lazy='dynamic'))

    def __repr__(self):
        return f'<Activity {self.action} by {self.user_id}>'
