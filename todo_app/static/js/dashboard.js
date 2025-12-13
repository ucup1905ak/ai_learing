/**
 * Dashboard JavaScript
 * Handles todo list views (List, Kanban, Timeline) and CRUD operations
 */

let todos = [];
let currentView = 'list';

// ==================== Initialization ====================

document.addEventListener('DOMContentLoaded', () => {
    loadTodos();
    setupViewSwitcher();
    setupFilters();
});

// ==================== View Switcher ====================

function setupViewSwitcher() {
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const view = btn.dataset.view;
            switchView(view);
        });
    });
}

function switchView(view) {
    currentView = view;
    
    // Update buttons
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.view === view);
    });
    
    // Show/hide views
    document.querySelectorAll('.view-container').forEach(container => {
        container.classList.add('hidden');
    });
    document.getElementById(`${view}-view`)?.classList.remove('hidden');
    
    renderTodos();
}

// ==================== Filters ====================

function setupFilters() {
    ['filter-status', 'filter-priority', 'sort-by'].forEach(id => {
        document.getElementById(id)?.addEventListener('change', renderTodos);
    });
}

function getFilteredTodos() {
    let filtered = [...todos];
    
    const statusFilter = document.getElementById('filter-status')?.value;
    const priorityFilter = document.getElementById('filter-priority')?.value;
    const sortBy = document.getElementById('sort-by')?.value;
    
    if (statusFilter && statusFilter !== 'all') {
        filtered = filtered.filter(t => t.status === statusFilter);
    }
    
    if (priorityFilter && priorityFilter !== 'all') {
        filtered = filtered.filter(t => t.priority === priorityFilter);
    }
    
    // Sort
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    
    filtered.sort((a, b) => {
        switch (sortBy) {
            case 'deadline':
                if (!a.deadline) return 1;
                if (!b.deadline) return -1;
                return new Date(a.deadline) - new Date(b.deadline);
            case 'priority':
                return priorityOrder[a.priority] - priorityOrder[b.priority];
            case 'title':
                return a.title.localeCompare(b.title);
            default:
                return new Date(b.created_at) - new Date(a.created_at);
        }
    });
    
    return filtered;
}

// ==================== Load Todos ====================

async function loadTodos() {
    try {
        todos = await apiRequest('/api/todos');
        renderTodos();
    } catch (error) {
        console.error('Failed to load todos:', error);
    }
}

// ==================== Render Functions ====================

function renderTodos() {
    const filtered = getFilteredTodos();
    
    switch (currentView) {
        case 'list':
            renderListView(filtered);
            break;
        case 'kanban':
            renderKanbanView(filtered);
            break;
        case 'timeline':
            renderTimelineView(filtered);
            break;
    }
}

function renderListView(todos) {
    const container = document.getElementById('todo-list');
    
    if (todos.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-clipboard-list"></i>
                <h3>No tasks yet</h3>
                <p>Click "Add Task" to create your first task</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = todos.map(todo => `
        <div class="todo-item ${todo.status === 'completed' ? 'completed' : ''} priority-${todo.priority}" data-id="${todo.id}">
            <div class="todo-checkbox ${todo.status === 'completed' ? 'checked' : ''}" 
                 onclick="toggleTodoStatus(${todo.id}, '${todo.status}')"></div>
            <div class="todo-content" onclick="openTodoModal(${todo.id})">
                <div class="todo-title">
                    ${escapeHtml(todo.title)}
                    ${todo.access_type !== 'owner' ? `<span class="badge badge-shared"><i class="fas fa-share-alt"></i> Shared</span>` : ''}
                </div>
                <div class="todo-meta">
                    <span><i class="fas fa-calendar-plus"></i> ${formatDate(todo.created_at)}</span>
                    ${todo.deadline ? `<span class="${isOverdue(todo.deadline) && todo.status !== 'completed' ? 'text-danger' : ''}"><i class="fas fa-clock"></i> Due: ${formatDate(todo.deadline)}</span>` : ''}
                    <span class="${getStatusBadgeClass(todo.status)}">${todo.status}</span>
                    <span class="${getPriorityBadgeClass(todo.priority)}">${todo.priority}</span>
                </div>
            </div>
            <div class="todo-actions">
                <button class="action-btn" onclick="openTodoModal(${todo.id})" title="Edit">
                    <i class="fas fa-edit"></i>
                </button>
                ${todo.access_type === 'owner' ? `
                <button class="action-btn" onclick="openShareModal('todo', ${todo.id})" title="Share">
                    <i class="fas fa-share-alt"></i>
                </button>
                <button class="action-btn delete" onclick="deleteTodo(${todo.id})" title="Delete">
                    <i class="fas fa-trash"></i>
                </button>
                ` : ''}
            </div>
        </div>
    `).join('');
}

function renderKanbanView(todos) {
    const columns = {
        pending: document.getElementById('kanban-pending'),
        'in-progress': document.getElementById('kanban-in-progress'),
        completed: document.getElementById('kanban-completed')
    };
    
    // Clear columns
    Object.values(columns).forEach(col => {
        if (col) col.innerHTML = '';
    });
    
    // Count todos per status
    const counts = { pending: 0, 'in-progress': 0, completed: 0 };
    
    todos.forEach(todo => {
        counts[todo.status]++;
        
        const card = document.createElement('div');
        card.className = `kanban-card priority-${todo.priority}`;
        card.onclick = () => openTodoModal(todo.id);
        
        card.innerHTML = `
            <h4>${escapeHtml(todo.title)}</h4>
            ${todo.description ? `<p>${escapeHtml(truncate(todo.description, 80))}</p>` : ''}
            <div class="kanban-card-footer">
                <span class="${getPriorityBadgeClass(todo.priority)}">${todo.priority}</span>
                ${todo.deadline ? `<span><i class="fas fa-clock"></i> ${formatDate(todo.deadline)}</span>` : ''}
            </div>
        `;
        
        if (columns[todo.status]) {
            columns[todo.status].appendChild(card);
        }
    });
    
    // Update counts
    document.getElementById('pending-count').textContent = counts.pending;
    document.getElementById('in-progress-count').textContent = counts['in-progress'];
    document.getElementById('completed-count').textContent = counts.completed;
}

function renderTimelineView(todos) {
    const container = document.getElementById('timeline');
    
    // Sort by deadline for timeline
    const sorted = [...todos].filter(t => t.deadline).sort((a, b) => 
        new Date(a.deadline) - new Date(b.deadline)
    );
    
    const noDeadline = todos.filter(t => !t.deadline);
    
    if (sorted.length === 0 && noDeadline.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-stream"></i>
                <h3>No tasks with deadlines</h3>
                <p>Add deadlines to your tasks to see them here</p>
            </div>
        `;
        return;
    }
    
    let html = '';
    
    sorted.forEach(todo => {
        const overdue = isOverdue(todo.deadline) && todo.status !== 'completed';
        const completed = todo.status === 'completed';
        
        html += `
            <div class="timeline-item ${overdue ? 'overdue' : ''} ${completed ? 'completed' : ''}" onclick="openTodoModal(${todo.id})">
                <div class="timeline-date">
                    <i class="fas fa-calendar"></i>
                    ${formatDateTime(todo.deadline)}
                    ${overdue ? '<span class="badge badge-high">Overdue</span>' : ''}
                </div>
                <h4>${escapeHtml(todo.title)}</h4>
                ${todo.description ? `<p>${escapeHtml(truncate(todo.description, 150))}</p>` : ''}
                <div style="margin-top: 10px;">
                    <span class="${getStatusBadgeClass(todo.status)}">${todo.status}</span>
                    <span class="${getPriorityBadgeClass(todo.priority)}">${todo.priority}</span>
                </div>
            </div>
        `;
    });
    
    // Add tasks without deadlines at the end
    if (noDeadline.length > 0) {
        html += '<div class="timeline-item" style="opacity: 0.7;"><h4 style="color: var(--text-muted);"><i class="fas fa-question-circle"></i> Tasks without deadlines</h4></div>';
        noDeadline.forEach(todo => {
            html += `
                <div class="timeline-item" onclick="openTodoModal(${todo.id})">
                    <div class="timeline-date">
                        <i class="fas fa-infinity"></i> No deadline set
                    </div>
                    <h4>${escapeHtml(todo.title)}</h4>
                    <div style="margin-top: 10px;">
                        <span class="${getStatusBadgeClass(todo.status)}">${todo.status}</span>
                        <span class="${getPriorityBadgeClass(todo.priority)}">${todo.priority}</span>
                    </div>
                </div>
            `;
        });
    }
    
    container.innerHTML = html;
}

// ==================== Todo Modal ====================

function openTodoModal(todoId = null) {
    const template = document.getElementById('todo-form-template');
    const content = template.content.cloneNode(true);
    
    const title = todoId ? 'Edit Task' : 'Add New Task';
    openModal(title, content);
    
    if (todoId) {
        const todo = todos.find(t => t.id === todoId);
        if (todo) {
            document.getElementById('todo-id').value = todo.id;
            document.getElementById('todo-title').value = todo.title;
            document.getElementById('todo-description').value = todo.description || '';
            document.getElementById('todo-status').value = todo.status;
            document.getElementById('todo-priority').value = todo.priority;
            if (todo.deadline) {
                document.getElementById('todo-deadline').value = toLocalDateTimeString(todo.deadline);
            }
        }
    }
}

async function saveTodo(event) {
    event.preventDefault();
    
    const id = document.getElementById('todo-id').value;
    const data = {
        title: document.getElementById('todo-title').value,
        description: document.getElementById('todo-description').value,
        status: document.getElementById('todo-status').value,
        priority: document.getElementById('todo-priority').value,
        deadline: document.getElementById('todo-deadline').value || null
    };
    
    try {
        if (id) {
            await apiRequest(`/api/todos/${id}`, 'PUT', data);
            showNotification('Task updated successfully');
        } else {
            await apiRequest('/api/todos', 'POST', data);
            showNotification('Task created successfully');
        }
        
        closeModal();
        loadTodos();
    } catch (error) {
        // Error already shown by apiRequest
    }
}

async function toggleTodoStatus(todoId, currentStatus) {
    const newStatus = currentStatus === 'completed' ? 'pending' : 'completed';
    
    try {
        await apiRequest(`/api/todos/${todoId}`, 'PUT', { status: newStatus });
        loadTodos();
    } catch (error) {
        // Error already shown
    }
}

async function deleteTodo(todoId) {
    if (!confirm('Are you sure you want to delete this task?')) return;
    
    try {
        await apiRequest(`/api/todos/${todoId}`, 'DELETE');
        showNotification('Task deleted successfully');
        loadTodos();
    } catch (error) {
        // Error already shown
    }
}

// ==================== Share Modal ====================

async function openShareModal(itemType, itemId) {
    const template = document.getElementById('share-form-template');
    const content = template.content.cloneNode(true);
    
    openModal(`Share ${itemType === 'todo' ? 'Task' : 'Event'}`, content);
    
    document.getElementById('share-item-type').value = itemType;
    document.getElementById('share-item-id').value = itemId;
    
    // Load users
    const users = await loadUsers();
    populateUserSelect('share-user', users);
    
    // Load current shares
    loadSharedUsers(itemType, itemId);
}

async function loadSharedUsers(itemType, itemId) {
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
                <button class="btn btn-sm btn-danger" onclick="removeShare(${s.id})">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `).join('');
    } catch (error) {
        container.innerHTML = '<p style="color: var(--danger-color);">Failed to load shared users.</p>';
    }
}

async function shareItem(event) {
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
        loadSharedUsers(data.item_type, data.item_id);
        document.getElementById('share-user').value = '';
    } catch (error) {
        // Error already shown
    }
}

async function removeShare(shareId) {
    try {
        await apiRequest(`/api/share/${shareId}`, 'DELETE');
        showNotification('Share removed');
        
        const itemType = document.getElementById('share-item-type').value;
        const itemId = document.getElementById('share-item-id').value;
        loadSharedUsers(itemType, itemId);
    } catch (error) {
        // Error already shown
    }
}
