from flask import Blueprint, request, jsonify
from flask_login import login_required
import random

ai_bp = Blueprint('ai', __name__)

@ai_bp.route('/ai/suggest-subtasks', methods=['POST'])
@login_required
def suggest_subtasks():
    data = request.get_json()
    task_title = data.get('title', '')
    
    # Mock AI response
    suggestions = [
        f"Research {task_title}",
        f"Draft outline for {task_title}",
        f"Review {task_title} with team",
        "Finalize implementation"
    ]
    
    return jsonify({'suggestions': suggestions})

@ai_bp.route('/ai/summarize', methods=['POST'])
@login_required
def summarize_text():
    # Mock summary
    return jsonify({'summary': 'This is a mocked AI summary of the content provided.'})
