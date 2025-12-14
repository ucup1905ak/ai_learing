from app import db
from datetime import datetime

class SharedItem(db.Model):
    __tablename__ = 'shared_items'

    id = db.Column(db.Integer, primary_key=True)
    item_type = db.Column(db.String(20), nullable=False) # 'todo', 'task', 'event', 'project'
    item_id = db.Column(db.Integer, nullable=False)
    owner_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    shared_with_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    permission = db.Column(db.String(20), default='view') # 'view', 'edit'
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    owner = db.relationship('User', foreign_keys=[owner_id], backref='shared_owned_items')
    shared_with = db.relationship('User', foreign_keys=[shared_with_id], backref='received_shared_items')

    def __repr__(self):
        return f'<SharedItem {self.item_type}:{self.item_id} -> {self.shared_with_id}>'
