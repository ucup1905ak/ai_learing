from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager
from flask_migrate import Migrate
from flask_marshmallow import Marshmallow
from config import config

db = SQLAlchemy()
login_manager = LoginManager()
migrate = Migrate()
ma = Marshmallow()

def create_app(config_name='default'):
    app = Flask(__name__, 
                static_folder='../static', 
                template_folder='../templates')
    
    app.config.from_object(config[config_name])

    db.init_app(app)
    login_manager.init_app(app)
    migrate.init_app(app, db)
    ma.init_app(app)

    login_manager.login_view = 'auth.login'

    from app.models import user  # Import models to ensure they are registered with SQLAlchemy
    
    # Register Blueprints
    from app.auth.routes import auth_bp
    from app.views.main import views_bp
    from app.api.tasks import tasks_bp
    from app.api.projects import projects_bp
    from app.api.events import events_bp
    from app.api.sharing import sharing_bp
    from app.api.comments import comments_bp
    from app.api.notifications import notifications_bp
    from app.api.custom_fields import custom_fields_bp
    from app.api.time import time_bp
    from app.api.ai import ai_bp
    from app.api.checklists import checklists_bp
    from app.views.profile import profile_bp
    
    app.register_blueprint(auth_bp)
    app.register_blueprint(views_bp)
    app.register_blueprint(profile_bp)
    app.register_blueprint(tasks_bp, url_prefix='/api')
    app.register_blueprint(projects_bp, url_prefix='/api')
    app.register_blueprint(events_bp, url_prefix='/api')
    app.register_blueprint(sharing_bp, url_prefix='/api')
    app.register_blueprint(comments_bp, url_prefix='/api')
    app.register_blueprint(notifications_bp, url_prefix='/api')
    app.register_blueprint(custom_fields_bp, url_prefix='/api')
    app.register_blueprint(time_bp, url_prefix='/api')
    app.register_blueprint(ai_bp, url_prefix='/api')
    app.register_blueprint(checklists_bp, url_prefix='/api')

    return app
