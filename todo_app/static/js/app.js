/**
 * Main Application JavaScript
 * Common utilities and modal handling
 */

// ==================== Modal Functions ====================

function openModal(title, content) {
    document.getElementById('modal-title').textContent = title;
    document.getElementById('modal-body').innerHTML = '';
    
    if (typeof content === 'string') {
        document.getElementById('modal-body').innerHTML = content;
    } else {
        document.getElementById('modal-body').appendChild(content);
    }
    
    document.getElementById('modal-overlay').classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    document.getElementById('modal-overlay').classList.add('hidden');
    document.body.style.overflow = '';
}

// Close modal on overlay click
document.getElementById('modal-overlay')?.addEventListener('click', (e) => {
    if (e.target.id === 'modal-overlay') {
        closeModal();
    }
});

// Close modal on Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeModal();
    }
});

// ==================== API Helper Functions ====================

async function apiRequest(url, method = 'GET', data = null) {
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json',
        },
    };
    
    if (data) {
        options.body = JSON.stringify(data);
    }
    
    try {
        const response = await fetch(url, options);
        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.error || 'An error occurred');
        }
        
        return result;
    } catch (error) {
        console.error('API Error:', error);
        showNotification(error.message, 'error');
        throw error;
    }
}

// ==================== Notification System ====================

function showNotification(message, type = 'success') {
    const container = document.querySelector('.main-content');
    if (!container) return;
    
    // Remove existing notifications
    document.querySelectorAll('.notification').forEach(n => n.remove());
    
    const notification = document.createElement('div');
    notification.className = `notification flash-message ${type}`;
    notification.innerHTML = `
        <span>${message}</span>
        <button onclick="this.parentElement.remove()" style="background: none; border: none; color: inherit; cursor: pointer; margin-left: 10px;">&times;</button>
    `;
    
    container.insertBefore(notification, container.firstChild);
    
    setTimeout(() => {
        notification.remove();
    }, 5000);
}

// ==================== Date Formatting ====================

function formatDate(dateString) {
    if (!dateString) return 'No date';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function formatDateTime(dateString) {
    if (!dateString) return 'No date';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function formatTime(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
    });
}

function toLocalDateTimeString(date) {
    const d = new Date(date);
    const offset = d.getTimezoneOffset();
    const localDate = new Date(d.getTime() - offset * 60 * 1000);
    return localDate.toISOString().slice(0, 16);
}

function isOverdue(deadline) {
    if (!deadline) return false;
    return new Date(deadline) < new Date();
}

function getDaysUntil(deadline) {
    if (!deadline) return null;
    const now = new Date();
    const due = new Date(deadline);
    const diff = Math.ceil((due - now) / (1000 * 60 * 60 * 24));
    return diff;
}

// ==================== Utility Functions ====================

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function truncate(text, length = 100) {
    if (!text) return '';
    return text.length > length ? text.substring(0, length) + '...' : text;
}

function getStatusBadgeClass(status) {
    return `badge badge-${status}`;
}

function getPriorityBadgeClass(priority) {
    return `badge badge-${priority}`;
}

// ==================== Global Users Cache ====================

let usersCache = null;

async function loadUsers() {
    if (usersCache) return usersCache;
    
    try {
        usersCache = await apiRequest('/api/users');
        return usersCache;
    } catch (error) {
        return [];
    }
}

function populateUserSelect(selectId, users) {
    const select = document.getElementById(selectId);
    if (!select) return;
    
    select.innerHTML = '<option value="">Select a user...</option>';
    users.forEach(user => {
        select.innerHTML += `<option value="${user.id}">${escapeHtml(user.username)} (${escapeHtml(user.email)})</option>`;
    });
}

// ==================== Project Functions ====================

let projectsCache = [];

document.addEventListener('DOMContentLoaded', () => {
    if (document.body.classList.contains('main-content')) { // Only load if logged in
        loadProjects();
    }
});

async function loadProjects() {
    try {
        projectsCache = await apiRequest('/api/projects');
        renderProjects();
    } catch (error) {
        console.error('Failed to load projects:', error);
    }
}

function renderProjects() {
    const container = document.getElementById('projects-list');
    if (!container) return;
    
    if (projectsCache.length === 0) {
        container.innerHTML = '<li style="font-size: 0.9rem; color: var(--text-muted); padding: 5px 0;">No projects yet.</li>';
        return;
    }
    
    container.innerHTML = projectsCache.map(p => `
        <li style="margin-bottom: 5px;">
            <a href="${url_for_js('views.dashboard')}?project_id=${p.id}" style="display: flex; align-items: center; gap: 10px; color: var(--text-secondary); font-size: 0.95rem;">
                <span style="width: 10px; height: 10px; border-radius: 50%; background: ${p.color}; display: inline-block; flex-shrink: 0;"></span>
                <span>${escapeHtml(p.title)}</span>
            </a>
        </li>
    `).join('');
}

function openProjectModal(projectId = null) {
    let title = projectId ? 'Edit Project' : 'Create New Project';
    let content = `
        <form id="project-form" onsubmit="saveProject(event)">
            <input type="hidden" id="project-id" value="${projectId || ''}">
            <div class="form-group">
                <label for="project-title">Project Title *</label>
                <input type="text" id="project-title" required placeholder="Enter project title">
            </div>
            <div class="form-group">
                <label for="project-description">Description</label>
                <textarea id="project-description" rows="3" placeholder="Project description"></textarea>
            </div>
            <div class="form-group">
                <label for="project-color">Color</label>
                <input type="color" id="project-color" value="#00f3ff">
            </div>
            <div class="form-actions">
                <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
                <button type="submit" class="btn btn-primary">Save Project</button>
            </div>
        </form>
    `;
    openModal(title, content);
    
    if (projectId) {
        const project = projectsCache.find(p => p.id === projectId);
        if (project) {
            document.getElementById('project-title').value = project.title;
            document.getElementById('project-description').value = project.description || '';
            document.getElementById('project-color').value = project.color || '#00f3ff';
        }
    }
}

async function saveProject(event) {
    event.preventDefault();
    const id = document.getElementById('project-id').value;
    const data = {
        title: document.getElementById('project-title').value,
        description: document.getElementById('project-description').value,
        color: document.getElementById('project-color').value
    };
    
    try {
        if (id) {
            await apiRequest(`/api/projects/${id}`, 'PUT', data); // Need PUT endpoint for projects
            showNotification('Project updated successfully');
        } else {
            await apiRequest('/api/projects', 'POST', data);
            showNotification('Project created successfully');
        }
        closeModal();
        loadProjects();
    } catch (error) {
        // Error handled by apiRequest
    }
}

// Helper to simulate Flask's url_for for JS
function url_for_js(endpoint, params = {}) {
    let url = '';
    switch(endpoint) {
        case 'views.dashboard': url = '/dashboard'; break;
        // Add other endpoints as needed
        default: url = '/';
    }
    if (Object.keys(params).length > 0) {
        const query = new URLSearchParams(params).toString();
        url += `?${query}`;
    }
    return url;
}

// ==================== Notifications ====================

document.addEventListener('DOMContentLoaded', () => {
    checkNotifications();
    setInterval(checkNotifications, 30000); // Check every 30s
});

async function checkNotifications() {
    try {
        const notifs = await apiRequest('/api/notifications');
        const badge = document.getElementById('notif-badge');
        const list = document.getElementById('notif-dropdown');
        
        const unread = notifs.filter(n => !n.is_read);
        
        if (badge) {
            badge.style.display = unread.length > 0 ? 'block' : 'none';
        }
        
        if (list) {
            if (notifs.length === 0) {
                list.innerHTML = '<div style="padding: 10px; color: var(--text-muted);">No notifications</div>';
            } else {
                list.innerHTML = notifs.map(n => `
                    <div style="padding: 10px; border-bottom: 1px solid var(--border-color); ${n.is_read ? 'opacity: 0.6;' : 'background: var(--bg-light);'} cursor: pointer;" onclick="markRead(${n.id})">
                        <div>${escapeHtml(n.message)}</div>
                        <div style="font-size: 0.7rem; color: var(--text-muted); margin-top: 5px;">${formatDateTime(n.created_at)}</div>
                    </div>
                `).join('');
            }
        }
    } catch (error) {
        // Silent fail
    }
}

function toggleNotifications() {
    document.getElementById('notif-dropdown').classList.toggle('hidden');
}

async function markRead(id) {
    try {
        await apiRequest(`/api/notifications/${id}/read`, 'PUT');
        checkNotifications();
    } catch (error) {}
}
