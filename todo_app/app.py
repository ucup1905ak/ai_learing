"""
Todo List / Task Management / Event Planner Application
Flask backend with SQLite database
"""

from flask import Flask, render_template, request, jsonify, redirect, url_for, session, flash
from flask_login import LoginManager, UserMixin, login_user, logout_user, login_required, current_user
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime, timedelta
import sqlite3
import os

app = Flask(__name__)
app.secret_key = 'your-secret-key-change-in-production'

# Flask-Login setup
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'login'

DATABASE = 'todo_app.sqlite'

def get_db():
    """Get database connection"""
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    """Initialize the database with tables"""
    conn = get_db()
    cursor = conn.cursor()
    
    # Users table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Todos table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS todos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            title TEXT NOT NULL,
            description TEXT,
            status TEXT DEFAULT 'pending',
            priority TEXT DEFAULT 'medium',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            deadline TIMESTAMP,
            completed_at TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    ''')
    
    # Events table (for calendar)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            title TEXT NOT NULL,
            description TEXT,
            start_date TIMESTAMP NOT NULL,
            end_date TIMESTAMP,
            all_day INTEGER DEFAULT 0,
            color TEXT DEFAULT '#3498db',
            location TEXT,
            reminder INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    ''')
    
    # Shared items table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS shared_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            item_type TEXT NOT NULL,
            item_id INTEGER NOT NULL,
            owner_id INTEGER NOT NULL,
            shared_with_id INTEGER NOT NULL,
            permission TEXT DEFAULT 'view',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (owner_id) REFERENCES users (id),
            FOREIGN KEY (shared_with_id) REFERENCES users (id)
        )
    ''')
    
    conn.commit()
    conn.close()

# User class for Flask-Login
class User(UserMixin):
    def __init__(self, id, username, email):
        self.id = id
        self.username = username
        self.email = email

@login_manager.user_loader
def load_user(user_id):
    conn = get_db()
    user = conn.execute('SELECT * FROM users WHERE id = ?', (user_id,)).fetchone()
    conn.close()
    if user:
        return User(user['id'], user['username'], user['email'])
    return None

# ==================== AUTH ROUTES ====================

@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        username = request.form.get('username')
        email = request.form.get('email')
        password = request.form.get('password')
        
        conn = get_db()
        try:
            cursor = conn.cursor()
            cursor.execute(
                'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)',
                (username, email, generate_password_hash(password))
            )
            conn.commit()
            flash('Registration successful! Please login.', 'success')
            return redirect(url_for('login'))
        except sqlite3.IntegrityError:
            flash('Username or email already exists.', 'error')
        finally:
            conn.close()
    
    return render_template('register.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        
        conn = get_db()
        user = conn.execute('SELECT * FROM users WHERE username = ?', (username,)).fetchone()
        conn.close()
        
        if user and check_password_hash(user['password_hash'], password):
            user_obj = User(user['id'], user['username'], user['email'])
            login_user(user_obj)
            return redirect(url_for('dashboard'))
        else:
            flash('Invalid username or password.', 'error')
    
    return render_template('login.html')

@app.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect(url_for('login'))

# ==================== PAGE ROUTES ====================

@app.route('/')
def index():
    if current_user.is_authenticated:
        return redirect(url_for('dashboard'))
    return redirect(url_for('login'))

@app.route('/dashboard')
@login_required
def dashboard():
    return render_template('dashboard.html')

@app.route('/calendar')
@login_required
def calendar():
    return render_template('calendar.html')

@app.route('/users')
@login_required
def users():
    return render_template('users.html')

# ==================== TODO API ROUTES ====================

@app.route('/api/todos', methods=['GET'])
@login_required
def get_todos():
    conn = get_db()
    
    # Get own todos
    own_todos = conn.execute('''
        SELECT t.*, u.username as owner_name, 'owner' as access_type
        FROM todos t
        JOIN users u ON t.user_id = u.id
        WHERE t.user_id = ?
    ''', (current_user.id,)).fetchall()
    
    # Get shared todos
    shared_todos = conn.execute('''
        SELECT t.*, u.username as owner_name, s.permission as access_type
        FROM todos t
        JOIN users u ON t.user_id = u.id
        JOIN shared_items s ON s.item_id = t.id AND s.item_type = 'todo'
        WHERE s.shared_with_id = ?
    ''', (current_user.id,)).fetchall()
    
    conn.close()
    
    todos = []
    for todo in list(own_todos) + list(shared_todos):
        todos.append({
            'id': todo['id'],
            'title': todo['title'],
            'description': todo['description'],
            'status': todo['status'],
            'priority': todo['priority'],
            'created_at': todo['created_at'],
            'deadline': todo['deadline'],
            'completed_at': todo['completed_at'],
            'owner_name': todo['owner_name'],
            'access_type': todo['access_type']
        })
    
    return jsonify(todos)

@app.route('/api/todos', methods=['POST'])
@login_required
def create_todo():
    data = request.get_json()
    
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO todos (user_id, title, description, status, priority, deadline)
        VALUES (?, ?, ?, ?, ?, ?)
    ''', (
        current_user.id,
        data.get('title'),
        data.get('description', ''),
        data.get('status', 'pending'),
        data.get('priority', 'medium'),
        data.get('deadline')
    ))
    conn.commit()
    todo_id = cursor.lastrowid
    conn.close()
    
    return jsonify({'id': todo_id, 'message': 'Todo created successfully'}), 201

@app.route('/api/todos/<int:todo_id>', methods=['PUT'])
@login_required
def update_todo(todo_id):
    data = request.get_json()
    
    conn = get_db()
    
    # Check ownership or edit permission
    todo = conn.execute('SELECT * FROM todos WHERE id = ?', (todo_id,)).fetchone()
    if not todo:
        conn.close()
        return jsonify({'error': 'Todo not found'}), 404
    
    if todo['user_id'] != current_user.id:
        # Check if user has edit permission
        shared = conn.execute('''
            SELECT * FROM shared_items 
            WHERE item_type = 'todo' AND item_id = ? AND shared_with_id = ? AND permission = 'edit'
        ''', (todo_id, current_user.id)).fetchone()
        if not shared:
            conn.close()
            return jsonify({'error': 'Permission denied'}), 403
    
    completed_at = None
    if data.get('status') == 'completed' and todo['status'] != 'completed':
        completed_at = datetime.now().isoformat()
    
    conn.execute('''
        UPDATE todos 
        SET title = ?, description = ?, status = ?, priority = ?, deadline = ?, completed_at = COALESCE(?, completed_at)
        WHERE id = ?
    ''', (
        data.get('title', todo['title']),
        data.get('description', todo['description']),
        data.get('status', todo['status']),
        data.get('priority', todo['priority']),
        data.get('deadline', todo['deadline']),
        completed_at,
        todo_id
    ))
    conn.commit()
    conn.close()
    
    return jsonify({'message': 'Todo updated successfully'})

@app.route('/api/todos/<int:todo_id>', methods=['DELETE'])
@login_required
def delete_todo(todo_id):
    conn = get_db()
    
    todo = conn.execute('SELECT * FROM todos WHERE id = ? AND user_id = ?', (todo_id, current_user.id)).fetchone()
    if not todo:
        conn.close()
        return jsonify({'error': 'Todo not found or permission denied'}), 404
    
    conn.execute('DELETE FROM shared_items WHERE item_type = ? AND item_id = ?', ('todo', todo_id))
    conn.execute('DELETE FROM todos WHERE id = ?', (todo_id,))
    conn.commit()
    conn.close()
    
    return jsonify({'message': 'Todo deleted successfully'})

# ==================== EVENT API ROUTES ====================

@app.route('/api/events', methods=['GET'])
@login_required
def get_events():
    conn = get_db()
    
    # Get own events
    own_events = conn.execute('''
        SELECT e.*, u.username as owner_name, 'owner' as access_type
        FROM events e
        JOIN users u ON e.user_id = u.id
        WHERE e.user_id = ?
    ''', (current_user.id,)).fetchall()
    
    # Get shared events
    shared_events = conn.execute('''
        SELECT e.*, u.username as owner_name, s.permission as access_type
        FROM events e
        JOIN users u ON e.user_id = u.id
        JOIN shared_items s ON s.item_id = e.id AND s.item_type = 'event'
        WHERE s.shared_with_id = ?
    ''', (current_user.id,)).fetchall()
    
    conn.close()
    
    events = []
    for event in list(own_events) + list(shared_events):
        events.append({
            'id': event['id'],
            'title': event['title'],
            'description': event['description'],
            'start': event['start_date'],
            'end': event['end_date'],
            'allDay': bool(event['all_day']),
            'color': event['color'],
            'location': event['location'],
            'reminder': event['reminder'],
            'owner_name': event['owner_name'],
            'access_type': event['access_type']
        })
    
    return jsonify(events)

@app.route('/api/events', methods=['POST'])
@login_required
def create_event():
    data = request.get_json()
    
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO events (user_id, title, description, start_date, end_date, all_day, color, location, reminder)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        current_user.id,
        data.get('title'),
        data.get('description', ''),
        data.get('start'),
        data.get('end'),
        1 if data.get('allDay') else 0,
        data.get('color', '#3498db'),
        data.get('location', ''),
        data.get('reminder', 0)
    ))
    conn.commit()
    event_id = cursor.lastrowid
    conn.close()
    
    return jsonify({'id': event_id, 'message': 'Event created successfully'}), 201

@app.route('/api/events/<int:event_id>', methods=['PUT'])
@login_required
def update_event(event_id):
    data = request.get_json()
    
    conn = get_db()
    
    event = conn.execute('SELECT * FROM events WHERE id = ?', (event_id,)).fetchone()
    if not event:
        conn.close()
        return jsonify({'error': 'Event not found'}), 404
    
    if event['user_id'] != current_user.id:
        shared = conn.execute('''
            SELECT * FROM shared_items 
            WHERE item_type = 'event' AND item_id = ? AND shared_with_id = ? AND permission = 'edit'
        ''', (event_id, current_user.id)).fetchone()
        if not shared:
            conn.close()
            return jsonify({'error': 'Permission denied'}), 403
    
    conn.execute('''
        UPDATE events 
        SET title = ?, description = ?, start_date = ?, end_date = ?, all_day = ?, color = ?, location = ?, reminder = ?
        WHERE id = ?
    ''', (
        data.get('title', event['title']),
        data.get('description', event['description']),
        data.get('start', event['start_date']),
        data.get('end', event['end_date']),
        1 if data.get('allDay') else 0,
        data.get('color', event['color']),
        data.get('location', event['location']),
        data.get('reminder', event['reminder']),
        event_id
    ))
    conn.commit()
    conn.close()
    
    return jsonify({'message': 'Event updated successfully'})

@app.route('/api/events/<int:event_id>', methods=['DELETE'])
@login_required
def delete_event(event_id):
    conn = get_db()
    
    event = conn.execute('SELECT * FROM events WHERE id = ? AND user_id = ?', (event_id, current_user.id)).fetchone()
    if not event:
        conn.close()
        return jsonify({'error': 'Event not found or permission denied'}), 404
    
    conn.execute('DELETE FROM shared_items WHERE item_type = ? AND item_id = ?', ('event', event_id))
    conn.execute('DELETE FROM events WHERE id = ?', (event_id,))
    conn.commit()
    conn.close()
    
    return jsonify({'message': 'Event deleted successfully'})

# ==================== SHARING API ROUTES ====================

@app.route('/api/users', methods=['GET'])
@login_required
def get_users():
    conn = get_db()
    users = conn.execute('SELECT id, username, email FROM users WHERE id != ?', (current_user.id,)).fetchall()
    conn.close()
    
    return jsonify([{'id': u['id'], 'username': u['username'], 'email': u['email']} for u in users])

@app.route('/api/share', methods=['POST'])
@login_required
def share_item():
    data = request.get_json()
    item_type = data.get('item_type')
    item_id = data.get('item_id')
    shared_with_id = data.get('shared_with_id')
    permission = data.get('permission', 'view')
    
    conn = get_db()
    
    # Verify ownership
    if item_type == 'todo':
        item = conn.execute('SELECT * FROM todos WHERE id = ? AND user_id = ?', (item_id, current_user.id)).fetchone()
    else:
        item = conn.execute('SELECT * FROM events WHERE id = ? AND user_id = ?', (item_id, current_user.id)).fetchone()
    
    if not item:
        conn.close()
        return jsonify({'error': 'Item not found or permission denied'}), 404
    
    # Check if already shared
    existing = conn.execute('''
        SELECT * FROM shared_items WHERE item_type = ? AND item_id = ? AND shared_with_id = ?
    ''', (item_type, item_id, shared_with_id)).fetchone()
    
    if existing:
        conn.execute('''
            UPDATE shared_items SET permission = ? WHERE id = ?
        ''', (permission, existing['id']))
    else:
        conn.execute('''
            INSERT INTO shared_items (item_type, item_id, owner_id, shared_with_id, permission)
            VALUES (?, ?, ?, ?, ?)
        ''', (item_type, item_id, current_user.id, shared_with_id, permission))
    
    conn.commit()
    conn.close()
    
    return jsonify({'message': 'Item shared successfully'})

@app.route('/api/share/<int:share_id>', methods=['DELETE'])
@login_required
def unshare_item(share_id):
    conn = get_db()
    conn.execute('DELETE FROM shared_items WHERE id = ? AND owner_id = ?', (share_id, current_user.id))
    conn.commit()
    conn.close()
    
    return jsonify({'message': 'Share removed successfully'})

@app.route('/api/shared/<item_type>/<int:item_id>', methods=['GET'])
@login_required
def get_shared_users(item_type, item_id):
    conn = get_db()
    shared = conn.execute('''
        SELECT s.id, s.permission, u.id as user_id, u.username, u.email
        FROM shared_items s
        JOIN users u ON s.shared_with_id = u.id
        WHERE s.item_type = ? AND s.item_id = ? AND s.owner_id = ?
    ''', (item_type, item_id, current_user.id)).fetchall()
    conn.close()
    
    return jsonify([{
        'id': s['id'],
        'user_id': s['user_id'],
        'username': s['username'],
        'email': s['email'],
        'permission': s['permission']
    } for s in shared])

if __name__ == '__main__':
    init_db()
    app.run(debug=True, host='0.0.0.0', port=5000)
