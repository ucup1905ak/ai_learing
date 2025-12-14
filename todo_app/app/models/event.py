from app import db
from datetime import datetime

class Event(db.Model):
    __tablename__ = 'events'

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    start_date = db.Column(db.DateTime, nullable=False)
    end_date = db.Column(db.DateTime)
    all_day = db.Column(db.Boolean, default=False)
    color = db.Column(db.String(7), default='#3498db')
    location = db.Column(db.String(200))
    reminder = db.Column(db.Integer, default=0) # Minutes before
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)

    def __repr__(self):
        return f'<Event {self.title}>'
