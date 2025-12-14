from app import db
from datetime import datetime

class Comment(db.Model):
    __tablename__ = 'comments'

    id = db.Column(db.Integer, primary_key=True)
    content = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    task_id = db.Column(db.Integer, db.ForeignKey('tasks.id'), nullable=True)
    event_id = db.Column(db.Integer, db.ForeignKey('events.id'), nullable=True)

    # Relationships
    user = db.relationship('User', backref=db.backref('comments', lazy='dynamic'))
    task = db.relationship('Task', backref=db.backref('comments', lazy='dynamic'))
    event = db.relationship('Event', backref=db.backref('comments', lazy='dynamic'))

    def __repr__(self):
        return f'<Comment {self.id} by {self.user_id}>'
