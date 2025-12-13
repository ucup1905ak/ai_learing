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
