from flask import Blueprint

# We will define blueprints in their respective files to avoid circular imports if needed, 
# or here. DETAILED_PLAN suggests app/api/tasks.py and app/api/projects.py
# I will make them separate blueprints or one API blueprint. 
# DETAILED_PLAN says "app/api/tasks.py", "app/api/projects.py" and in app/__init__.py:
# app.register_blueprint(tasks_bp, url_prefix='/api')
# app.register_blueprint(projects_bp, url_prefix='/api')

# So I won't create a single 'api' blueprint here, but maybe helper functions.
