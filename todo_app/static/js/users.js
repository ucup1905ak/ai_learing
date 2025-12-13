/**
 * Users Page JavaScript
 * Handles user listing and shared items display
 */

let allUsers = [];
let myTodos = [];
let myEvents = [];

// ==================== Initialization ====================

document.addEventListener('DOMContentLoaded', () => {
    loadUsersPageData();
    setupTabs();
});

async function loadUsersPageData() {
    try {
        const [users, todos, events] = await Promise.all([
            apiRequest('/api/users'),
            apiRequest('/api/todos'),
            apiRequest('/api/events')
        ]);
        
        allUsers = users;
        myTodos = todos;
        myEvents = events;
        
        renderUsersList();
        renderSharedWithMe();
        renderMySharedItems();
    } catch (error) {
        console.error('Failed to load users page data:', error);
    }
}

// ==================== Tabs ====================

function setupTabs() {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const tabGroup = btn.closest('.shared-items-tabs, .my-shared-tabs');
            const contentParent = tabGroup.parentElement;
            const tabId = btn.dataset.tab;
            
            // Update active tab
            tabGroup.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // Show corresponding content
            contentParent.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            contentParent.querySelector(`#${tabId}`).classList.add('active');
        });
    });
}

// ==================== Users List ====================

function renderUsersList() {
    const container = document.getElementById('all-users-list');
    
    if (allUsers.length === 0) {
        container.innerHTML = `
            <div class="empty-state" style="padding: 30px;">
                <i class="fas fa-users"></i>
                <h3>No other users yet</h3>
                <p>You're the only user in the system</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = allUsers.map(user => `
        <div class="user-item">
            <div class="user-avatar">${user.username.charAt(0).toUpperCase()}</div>
            <div class="user-details">
                <h4>${escapeHtml(user.username)}</h4>
                <p>${escapeHtml(user.email)}</p>
            </div>
        </div>
    `).join('');
}

// ==================== Shared With Me ====================

function renderSharedWithMe() {
    const todosContainer = document.getElementById('shared-todos-list');
    const eventsContainer = document.getElementById('shared-events-list');
    
    // Filter shared items (not owned by current user)
    const sharedTodos = myTodos.filter(t => t.access_type !== 'owner');
    const sharedEvents = myEvents.filter(e => e.access_type !== 'owner');
    
    // Render shared todos
    if (sharedTodos.length === 0) {
        todosContainer.innerHTML = `
            <div class="empty-state" style="padding: 20px;">
                <p>No shared tasks</p>
            </div>
        `;
    } else {
        todosContainer.innerHTML = sharedTodos.map(todo => `
            <div class="shared-item">
                <div class="shared-item-info">
                    <h4>
                        ${escapeHtml(todo.title)}
                        <span class="badge badge-${todo.access_type === 'edit' ? 'success' : 'secondary'}">${todo.access_type}</span>
                    </h4>
                    <div class="shared-item-meta">
                        <span><i class="fas fa-user"></i> From: ${escapeHtml(todo.owner_name)}</span>
                        <span class="${getStatusBadgeClass(todo.status)}">${todo.status}</span>
                        <span class="${getPriorityBadgeClass(todo.priority)}">${todo.priority}</span>
                    </div>
                </div>
                <a href="/dashboard" class="btn btn-sm btn-primary">View</a>
            </div>
        `).join('');
    }
    
    // Render shared events
    if (sharedEvents.length === 0) {
        eventsContainer.innerHTML = `
            <div class="empty-state" style="padding: 20px;">
                <p>No shared events</p>
            </div>
        `;
    } else {
        eventsContainer.innerHTML = sharedEvents.map(event => `
            <div class="shared-item">
                <div class="shared-item-info">
                    <h4>
                        ${escapeHtml(event.title)}
                        <span class="badge badge-${event.access_type === 'edit' ? 'success' : 'secondary'}">${event.access_type}</span>
                    </h4>
                    <div class="shared-item-meta">
                        <span><i class="fas fa-user"></i> From: ${escapeHtml(event.owner_name)}</span>
                        <span><i class="fas fa-calendar"></i> ${formatDate(event.start)}</span>
                    </div>
                </div>
                <a href="/calendar" class="btn btn-sm btn-primary">View</a>
            </div>
        `).join('');
    }
}

// ==================== My Shared Items ====================

function renderMySharedItems() {
    const todosContainer = document.getElementById('my-todos-list');
    const eventsContainer = document.getElementById('my-events-list');
    
    // Filter owned items
    const ownedTodos = myTodos.filter(t => t.access_type === 'owner');
    const ownedEvents = myEvents.filter(e => e.access_type === 'owner');
    
    // Render owned todos with share button
    if (ownedTodos.length === 0) {
        todosContainer.innerHTML = `
            <div class="empty-state" style="padding: 20px;">
                <p>No tasks yet. <a href="/dashboard">Create one</a></p>
            </div>
        `;
    } else {
        todosContainer.innerHTML = ownedTodos.map(todo => `
            <div class="shared-item">
                <div class="shared-item-info">
                    <h4>${escapeHtml(todo.title)}</h4>
                    <div class="shared-item-meta">
                        <span class="${getStatusBadgeClass(todo.status)}">${todo.status}</span>
                        <span class="${getPriorityBadgeClass(todo.priority)}">${todo.priority}</span>
                        ${todo.deadline ? `<span><i class="fas fa-clock"></i> ${formatDate(todo.deadline)}</span>` : ''}
                    </div>
                </div>
                <button class="btn btn-sm btn-secondary" onclick="openShareModalFromUsers('todo', ${todo.id})">
                    <i class="fas fa-share-alt"></i> Share
                </button>
            </div>
        `).join('');
    }
    
    // Render owned events with share button
    if (ownedEvents.length === 0) {
        eventsContainer.innerHTML = `
            <div class="empty-state" style="padding: 20px;">
                <p>No events yet. <a href="/calendar">Create one</a></p>
            </div>
        `;
    } else {
        eventsContainer.innerHTML = ownedEvents.map(event => `
            <div class="shared-item">
                <div class="shared-item-info">
                    <h4>${escapeHtml(event.title)}</h4>
                    <div class="shared-item-meta">
                        <span><i class="fas fa-calendar"></i> ${formatDate(event.start)}</span>
                        ${event.location ? `<span><i class="fas fa-map-marker-alt"></i> ${escapeHtml(event.location)}</span>` : ''}
                    </div>
                </div>
                <button class="btn btn-sm btn-secondary" onclick="openShareModalFromUsers('event', ${event.id})">
                    <i class="fas fa-share-alt"></i> Share
                </button>
            </div>
        `).join('');
    }
}

// ==================== Share Modal ====================

async function openShareModalFromUsers(itemType, itemId) {
    const modalContent = `
        <div id="share-container">
            <div class="shared-users-list" id="shared-users-list">
                <p style="color: var(--text-muted);">Loading...</p>
            </div>
            
            <form id="share-form" onsubmit="shareItemFromUsers(event)">
                <input type="hidden" id="share-item-type" value="${itemType}">
                <input type="hidden" id="share-item-id" value="${itemId}">
                
                <div class="form-row">
                    <div class="form-group flex-grow">
                        <label for="share-user">Share with User</label>
                        <select id="share-user" name="shared_with_id" required>
                            <option value="">Select a user...</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label for="share-permission">Permission</label>
                        <select id="share-permission" name="permission">
                            <option value="view">View Only</option>
                            <option value="edit">Can Edit</option>
                        </select>
                    </div>
                </div>
                
                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" onclick="closeModal()">Close</button>
                    <button type="submit" class="btn btn-primary">Share</button>
                </div>
            </form>
        </div>
    `;
    
    openModal(`Share ${itemType === 'todo' ? 'Task' : 'Event'}`, modalContent);
    
    // Populate users
    populateUserSelect('share-user', allUsers);
    
    // Load current shares
    loadSharedUsersForItem(itemType, itemId);
}

async function loadSharedUsersForItem(itemType, itemId) {
    const container = document.getElementById('shared-users-list');
    
    try {
        const shared = await apiRequest(`/api/shared/${itemType}/${itemId}`);
        
        if (shared.length === 0) {
            container.innerHTML = '<p style="color: var(--text-muted); margin-bottom: 15px;">Not shared with anyone yet.</p>';
            return;
        }
        
        container.innerHTML = shared.map(s => `
            <div class="shared-user-item">
                <div class="shared-user-info">
                    <i class="fas fa-user-circle"></i>
                    <div class="shared-user-details">
                        <span class="username">${escapeHtml(s.username)}</span>
                        <span class="permission">Can ${s.permission}</span>
                    </div>
                </div>
                <button class="btn btn-sm btn-danger" onclick="removeShareFromUsers(${s.id}, '${itemType}', ${itemId})">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `).join('');
    } catch (error) {
        container.innerHTML = '<p style="color: var(--danger-color);">Failed to load shared users.</p>';
    }
}

async function shareItemFromUsers(event) {
    event.preventDefault();
    
    const data = {
        item_type: document.getElementById('share-item-type').value,
        item_id: parseInt(document.getElementById('share-item-id').value),
        shared_with_id: parseInt(document.getElementById('share-user').value),
        permission: document.getElementById('share-permission').value
    };
    
    try {
        await apiRequest('/api/share', 'POST', data);
        showNotification('Item shared successfully');
        loadSharedUsersForItem(data.item_type, data.item_id);
        document.getElementById('share-user').value = '';
    } catch (error) {
        // Error already shown
    }
}

async function removeShareFromUsers(shareId, itemType, itemId) {
    try {
        await apiRequest(`/api/share/${shareId}`, 'DELETE');
        showNotification('Share removed');
        loadSharedUsersForItem(itemType, itemId);
    } catch (error) {
        // Error already shown
    }
}
