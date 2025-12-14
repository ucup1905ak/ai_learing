from app import ma
from app.models.task import Task
from app.models.event import Event
from app.models.project import Project
from app.models.user import User
from app.models.shared import SharedItem
from marshmallow import fields

class UserSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = User
        load_instance = True
        exclude = ('password_hash',)

class TaskSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = Task
        load_instance = True
        include_fk = True
    
    owner_name = fields.Method("get_owner_name")
    
    def get_owner_name(self, obj):
        return obj.owner.username if obj.owner else None

class EventSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = Event
        load_instance = True
        include_fk = True
        
    owner_name = fields.Method("get_owner_name")
    
    def get_owner_name(self, obj):
        return obj.owner.username if obj.owner else None

class ProjectSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = Project
        load_instance = True
        include_fk = True

class SharedItemSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = SharedItem
        load_instance = True
        include_fk = True
    
    username = fields.Method("get_username")
    email = fields.Method("get_email")
    
    def get_username(self, obj):
        return obj.shared_with.username
        
    def get_email(self, obj):
        return obj.shared_with.email
