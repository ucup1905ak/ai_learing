from flask import render_template, redirect, url_for
from flask_login import login_required, current_user
from app.views import views_bp

@views_bp.route('/')
def index():
    if current_user.is_authenticated:
        return redirect(url_for('views.dashboard'))
    return render_template('landing.html')

@views_bp.route('/dashboard')
@login_required
def dashboard():
    return render_template('dashboard.html')

@views_bp.route('/calendar')
@login_required
def calendar():
    return render_template('calendar.html')

@views_bp.route('/users')
@login_required
def users():
    return render_template('users.html')
