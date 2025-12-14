import os
from flask import Blueprint, render_template, request, flash, redirect, url_for, current_app
from flask_login import login_required, current_user
from werkzeug.utils import secure_filename
from app import db

profile_bp = Blueprint('profile', __name__)

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in {'png', 'jpg', 'jpeg', 'gif'}

@profile_bp.route('/profile', methods=['GET', 'POST'])
@login_required
def profile():
    if request.method == 'POST':
        # Update text fields
        current_user.about_me = request.form.get('about_me')
        
        # Handle Avatar Upload
        if 'avatar' in request.files:
            file = request.files['avatar']
            if file and file.filename != '' and allowed_file(file.filename):
                filename = secure_filename(f"{current_user.id}_{file.filename}")
                file.save(os.path.join(current_app.config['UPLOAD_FOLDER'], filename))
                current_user.avatar = filename
        
        db.session.commit()
        flash('Profile updated successfully!', 'success')
        return redirect(url_for('profile.profile'))
    
    return render_template('profile.html', user=current_user)

