from app import db, login_manager
from flask_login import UserMixin
from datetime import datetime

class User(UserMixin, db.Model):
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(64), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(128))
    
    # Profile fields
    discriminator = db.Column(db.String(4), default='0000')
    avatar = db.Column(db.String(255), default='default_avatar.png')
    about_me = db.Column(db.Text)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    tasks = db.relationship('Task', backref='owner', lazy='dynamic')
    projects = db.relationship('Project', backref='owner', lazy='dynamic')
    events = db.relationship('Event', backref='owner', lazy='dynamic')
    
    def __repr__(self):
        return f'<User {self.username}#{self.discriminator}>'

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))
