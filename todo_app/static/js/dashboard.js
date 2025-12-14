/**
 * Dashboard JavaScript
 * Handles todo list views (List, Kanban, Timeline) and CRUD operations
 */

let todos = [];
let currentView = 'list';

// ==================== Initialization ====================

document.addEventListener('DOMContentLoaded', () => {
    loadProjectsForDashboard(); // Load projects first
    loadTodos();
    setupViewSwitcher();
    setupFilters();
});

// ==================== Project Integration ====================

async function loadProjectsForDashboard() {
    try {
        const projects = await apiRequest('/api/projects');
        
        // Populate Filter
        const filterSelect = document.getElementById('filter-project');
        if (filterSelect) {
            // Keep first two options (All, No Project)
            filterSelect.innerHTML = `
                <option value="all">All Projects</option>
                <option value="none">No Project</option>
            `;
            projects.forEach(p => {
                filterSelect.innerHTML += `<option value="${p.id}">${escapeHtml(p.title)}</option>`;
            });
            
            // Check URL params for pre-selection
            const urlParams = new URLSearchParams(window.location.search);
            const projectId = urlParams.get('project_id');
            if (projectId) {
                filterSelect.value = projectId;
            }
        }
        
        // Populate Modal Select
        const modalSelect = document.getElementById('todo-project');
        if (modalSelect) {
            modalSelect.innerHTML = '<option value="">No Project</option>';
            projects.forEach(p => {
                modalSelect.innerHTML += `<option value="${p.id}">${escapeHtml(p.title)}</option>`;
            });
        }
        
    } catch (error) {
        console.error('Failed to load projects:', error);
    }
}

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
    ['filter-status', 'filter-priority', 'sort-by', 'filter-project'].forEach(id => {
        document.getElementById(id)?.addEventListener('change', renderTodos);
    });
}

function getFilteredTodos() {
    let filtered = [...todos];
    
    const statusFilter = document.getElementById('filter-status')?.value;
    const priorityFilter = document.getElementById('filter-priority')?.value;
    const projectFilter = document.getElementById('filter-project')?.value;
    const sortBy = document.getElementById('sort-by')?.value;
    
    if (statusFilter && statusFilter !== 'all') {
        filtered = filtered.filter(t => t.status === statusFilter);
    }
    
    if (priorityFilter && priorityFilter !== 'all') {
        filtered = filtered.filter(t => t.priority === priorityFilter);
    }
    
    if (projectFilter && projectFilter !== 'all') {
        if (projectFilter === 'none') {
            filtered = filtered.filter(t => !t.project_id);
        } else {
            // Ensure type match (string vs int)
            filtered = filtered.filter(t => t.project_id == projectFilter);
        }
    }
    
    // Sort
    const priorityOrder = { high: 0, medium: 1, low: 2, urgent: -1 };
    
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

function organizeTasks(taskList) {
    const map = {};
    const roots = [];
    
    // Create map
    taskList.forEach(t => {
        map[t.id] = { ...t, children: [] };
    });
    
    // Build hierarchy
    taskList.forEach(t => {
        if (t.parent_id && map[t.parent_id]) {
            map[t.parent_id].children.push(map[t.id]);
        } else {
            roots.push(map[t.id]);
        }
    });
    
    // Sort children by created_at or order if available
    const sortChildren = (node) => {
        if (node.children.length > 0) {
            node.children.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            node.children.forEach(sortChildren);
        }
    };
    roots.forEach(sortChildren);
    
    return roots;
}

function renderListView(filteredTodos) {
    const container = document.getElementById('todo-list');
    
    if (filteredTodos.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-clipboard-list"></i>
                <h3>No tasks yet</h3>
                <p>Click "Add Task" to create your first task</p>
            </div>
        `;
        return;
    }

    const tree = organizeTasks(filteredTodos);
    container.innerHTML = tree.map(task => renderTaskItem(task)).join('');
}

function renderTaskItem(task, level = 0) {
    const indent = level * 30;
    
    let html = `
        <div class="todo-item ${task.status === 'completed' ? 'completed' : ''} priority-${task.priority}" 
             style="margin-left: ${indent}px; width: calc(100% - ${indent}px);" data-id="${task.id}">
            <div class="todo-checkbox ${task.status === 'completed' ? 'checked' : ''}" 
                 onclick="toggleTodoStatus(${task.id}, '${task.status}')"></div>
            <div class="todo-content" onclick="openTodoModal(${task.id})">
                <div class="todo-title">
                    ${escapeHtml(task.title)}
                    ${task.access_type !== 'owner' ? `<span class="badge badge-shared"><i class="fas fa-share-alt"></i> Shared</span>` : ''}
                </div>
                <div class="todo-meta">
                    <span><i class="fas fa-calendar-plus"></i> ${formatDate(task.created_at)}</span>
                    ${task.deadline ? `<span class="${isOverdue(task.deadline) && task.status !== 'completed' ? 'text-danger' : ''}"><i class="fas fa-clock"></i> Due: ${formatDate(task.deadline)}</span>` : ''}
                    <span class="${getStatusBadgeClass(task.status)}">${task.status}</span>
                    <span class="${getPriorityBadgeClass(task.priority)}">${task.priority}</span>
                </div>
            </div>
            <div class="todo-actions">
                <button class="action-btn" onclick="addSubtask(${task.id})" title="Add Subtask">
                    <i class="fas fa-level-down-alt"></i>
                </button>
                <button class="action-btn" onclick="openTodoModal(${task.id})" title="Edit">
                    <i class="fas fa-edit"></i>
                </button>
                ${task.access_type === 'owner' ? `
                <button class="action-btn" onclick="openShareModal('todo', ${task.id})" title="Share">
                    <i class="fas fa-share-alt"></i>
                </button>
                <button class="action-btn delete" onclick="deleteTodo(${task.id})" title="Delete">
                    <i class="fas fa-trash"></i>
                </button>
                ` : ''}
            </div>
        </div>
    `;
    
    if (task.children && task.children.length > 0) {
        html += task.children.map(child => renderTaskItem(child, level + 1)).join('');
    }
    
    return html;
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
        // Initialize Sortable
        new Sortable(col, {
            group: 'kanban', // set both lists to same group
            animation: 150,
            onEnd: async function (evt) {
                const itemEl = evt.item;
                const newStatus = evt.to.parentElement.dataset.status;
                const todoId = itemEl.dataset.id;
                
                if (evt.from !== evt.to) {
                     // Status changed
                     try {
                        await apiRequest(`/api/todos/${todoId}`, 'PUT', { status: newStatus });
                        // Update local model to reflect change without full reload if possible, 
                        // or just reload to be safe and simple.
                        loadTodos(); 
                     } catch (error) {
                         // Revert if failed (SortableJS has no built-in revert on async fail easily, 
                         // so reloading todos is safest to restore state)
                         loadTodos();
                     }
                }
            }
        });
    });
    
    // Count todos per status
    const counts = { pending: 0, 'in-progress': 0, completed: 0 };
    
    todos.forEach(todo => {
        counts[todo.status] = (counts[todo.status] || 0) + 1;
        
        const card = document.createElement('div');
        card.className = `kanban-card priority-${todo.priority}`;
        card.dataset.id = todo.id; // Add ID for SortableJS
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
    
    // 1. Prepare data: filter tasks with deadlines/start dates
    // For now we assume 'created_at' is start, 'deadline' is end.
    // Ideally we would have explicit start_date. Using created_at for Gantt visualization.
    
    const tasks = todos.filter(t => t.deadline).sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    
    if (tasks.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-stream"></i>
                <h3>No scheduled tasks</h3>
                <p>Add deadlines to see tasks on the timeline</p>
            </div>
        `;
        return;
    }
    
    // 2. Determine range
    let minDate = new Date();
    let maxDate = new Date();
    
    tasks.forEach(t => {
        const start = new Date(t.created_at);
        const end = new Date(t.deadline);
        if (start < minDate) minDate = start;
        if (end > maxDate) maxDate = end;
    });
    
    // Buffer
    minDate.setDate(minDate.getDate() - 1);
    maxDate.setDate(maxDate.getDate() + 5);
    
    const totalDuration = maxDate - minDate;
    
    // 3. Render Gantt
    let html = `<div class="gantt-chart" style="position: relative; min-height: 400px; overflow-x: auto; padding: 20px;">`;
    
    // Render time axis
    html += `<div class="gantt-axis" style="display: flex; border-bottom: 1px solid var(--border-color); margin-bottom: 10px; padding-bottom: 5px;">`;
    
    // Simple axis: show days
    const days = Math.ceil(totalDuration / (1000 * 60 * 60 * 24));
    for(let i=0; i<days; i+= Math.max(1, Math.floor(days/10))) {
        const d = new Date(minDate);
        d.setDate(d.getDate() + i);
        const left = (i / days) * 100;
        html += `<div style="position: absolute; left: ${left}%; font-size: 0.8rem; color: var(--text-muted);">${d.toLocaleDateString(undefined, {month:'short', day:'numeric'})}</div>`;
    }
    html += `</div>`; // End axis
    
    // Render Tasks
    html += `<div class="gantt-bars" style="position: relative; margin-top: 20px;">`;
    
    tasks.forEach((task, index) => {
        const start = new Date(task.created_at);
        const end = new Date(task.deadline);
        
        const startPercent = ((start - minDate) / totalDuration) * 100;
        const durationPercent = ((end - start) / totalDuration) * 100;
        const width = Math.max(durationPercent, 1); // Min 1% width
        
        const top = index * 40;
        
        html += `
            <div class="gantt-task-row" style="height: 35px; position: relative; margin-bottom: 5px;">
                <div class="gantt-bar priority-${task.priority}" 
                     style="position: absolute; left: ${Math.max(0, startPercent)}%; width: ${Math.min(100, width)}%; top: 0; height: 30px; border-radius: 4px; padding: 0 10px; display: flex; align-items: center; white-space: nowrap; overflow: hidden; cursor: pointer; color: #fff; background-color: var(--primary-color);"
                     onclick="openTodoModal(${task.id})">
                    <span style="font-size: 0.85rem; text-shadow: 0 1px 2px rgba(0,0,0,0.5);">${escapeHtml(task.title)}</span>
                </div>
            </div>
        `;
    });
    
    html += `</div>`; // End bars
    html += `</div>`; // End chart
    
    container.innerHTML = html;
}

// ==================== Todo Modal ====================

function openTodoModal(todoId = null, parentId = null) {
    const template = document.getElementById('todo-form-template');
    const content = template.content.cloneNode(true);
    
    let title = todoId ? 'Edit Task' : 'Add New Task';
    if (parentId) title = 'Add Subtask';
    
    openModal(title, content);
    
    // Populate projects in modal
    const projectSelect = document.getElementById('todo-project');
    if (projectSelect && projectsCache) {
        projectsCache.forEach(p => {
            projectSelect.innerHTML += `<option value="${p.id}">${escapeHtml(p.title)}</option>`;
        });
    }
    
    if (todoId) {
        const todo = todos.find(t => t.id === todoId);
        if (todo) {
            document.getElementById('todo-id').value = todo.id;
            document.getElementById('todo-parent-id').value = todo.parent_id || '';
            document.getElementById('todo-title').value = todo.title;
            document.getElementById('todo-description').value = todo.description || '';
            document.getElementById('todo-status').value = todo.status;
            document.getElementById('todo-priority').value = todo.priority;
            if (document.getElementById('todo-project')) {
                document.getElementById('todo-project').value = todo.project_id || '';
            }
            if (todo.deadline) {
                document.getElementById('todo-deadline').value = toLocalDateTimeString(todo.deadline);
            }
            
            // Show sections
            document.getElementById('comments-section').style.display = 'block';
            document.getElementById('time-tracking-section').style.display = 'block';
            document.getElementById('ai-section').style.display = 'block';
            document.getElementById('checklist-section').style.display = 'block';
            document.getElementById('custom-fields-section').style.display = 'block';
            
            loadComments(todoId);
            loadTimeEntries(todoId);
            loadChecklist(todoId);
            loadCustomFields(todoId);
        }
    } else {
        if (parentId) {
            document.getElementById('todo-parent-id').value = parentId;
        }
    }
}

// ==================== Checklists ====================

async function loadChecklist(taskId) {
    const container = document.getElementById('checklist-items');
    try {
        const items = await apiRequest(`/api/tasks/${taskId}/checklist`);
        
        if (items.length === 0) {
            container.innerHTML = '<div style="color: var(--text-muted); font-size: 0.85rem;">No items yet.</div>';
            return;
        }
        
        container.innerHTML = items.map(item => `
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 5px;">
                <input type="checkbox" ${item.is_completed ? 'checked' : ''} onchange="toggleChecklistItem(${item.id}, this.checked)">
                <span style="flex: 1; ${item.is_completed ? 'text-decoration: line-through; color: var(--text-muted);' : ''}">${escapeHtml(item.content)}</span>
                <button type="button" class="btn btn-sm btn-icon" onclick="deleteChecklistItem(${item.id})"><i class="fas fa-times" style="color: var(--danger-color);"></i></button>
            </div>
        `).join('');
    } catch (error) {
        console.error(error);
    }
}

async function addChecklistItem() {
    const input = document.getElementById('new-checklist-input');
    const content = input.value.trim();
    const taskId = document.getElementById('todo-id').value;
    
    if (!content) return;
    
    try {
        await apiRequest(`/api/tasks/${taskId}/checklist`, 'POST', { content });
        input.value = '';
        loadChecklist(taskId);
    } catch (error) {
        showNotification('Failed to add item', 'error');
    }
}

async function toggleChecklistItem(itemId, checked) {
    const taskId = document.getElementById('todo-id').value;
    try {
        await apiRequest(`/api/checklist/${itemId}`, 'PUT', { is_completed: checked });
        loadChecklist(taskId);
    } catch (error) {}
}

async function deleteChecklistItem(itemId) {
    const taskId = document.getElementById('todo-id').value;
    try {
        await apiRequest(`/api/checklist/${itemId}`, 'DELETE');
        loadChecklist(taskId);
    } catch (error) {}
}

// ==================== Custom Fields ====================

async function loadCustomFields(taskId) {
    const container = document.getElementById('custom-fields-container');
    try {
        // Load definitions
        const definitions = await apiRequest('/api/custom-fields/definitions');
        if (definitions.length === 0) {
            container.innerHTML = '<div style="color: var(--text-muted); width: 100%;">No custom fields defined.</div>';
            return;
        }
        
        // Load values
        const values = await apiRequest(`/api/tasks/${taskId}/custom-fields`);
        const valueMap = {};
        values.forEach(v => valueMap[v.field_definition_id] = v.value);
        
        container.innerHTML = definitions.map(def => {
            let inputHtml = '';
            const val = valueMap[def.id] || '';
            
            if (def.field_type === 'text') {
                inputHtml = `<input type="text" value="${escapeHtml(val)}" onchange="saveCustomField(${taskId}, ${def.id}, this.value)">`;
            } else if (def.field_type === 'number') {
                inputHtml = `<input type="number" value="${escapeHtml(val)}" onchange="saveCustomField(${taskId}, ${def.id}, this.value)">`;
            } else if (def.field_type === 'date') {
                inputHtml = `<input type="date" value="${escapeHtml(val)}" onchange="saveCustomField(${taskId}, ${def.id}, this.value)">`;
            } else if (def.field_type === 'select') {
                const opts = def.options ? def.options.split(',') : [];
                inputHtml = `<select onchange="saveCustomField(${taskId}, ${def.id}, this.value)">
                    <option value="">Select...</option>
                    ${opts.map(o => `<option value="${o.trim()}" ${val === o.trim() ? 'selected' : ''}>${o.trim()}</option>`).join('')}
                </select>`;
            }
            
            return `
                <div class="form-group" style="flex: 1; min-width: 45%;">
                    <label>${escapeHtml(def.name)}</label>
                    ${inputHtml}
                </div>
            `;
        }).join('');
        
    } catch (error) {
        console.error(error);
    }
}

async function saveCustomField(taskId, defId, value) {
    try {
        await apiRequest(`/api/tasks/${taskId}/custom-fields`, 'POST', {
            definition_id: defId,
            value: value
        });
    } catch (error) {
        showNotification('Failed to save field', 'error');
    }
}

// ==================== Time Tracking ====================

let timerInterval;

async function loadTimeEntries(taskId) {
    try {
        const entries = await apiRequest(`/api/tasks/${taskId}/time`);
        const list = document.getElementById('time-entries-list');
        const active = entries.find(e => !e.end_time);
        
        // Calculate total
        const totalSeconds = entries.reduce((acc, e) => acc + (e.duration || 0), 0);
        
        list.innerHTML = `Total active time: ${formatDuration(totalSeconds)}`;
        
        if (active) {
            startTimerDisplay(new Date(active.start_time));
            document.getElementById('btn-start-timer').style.display = 'none';
            document.getElementById('btn-stop-timer').style.display = 'inline-flex';
        } else {
            stopTimerDisplay();
            document.getElementById('btn-start-timer').style.display = 'inline-flex';
            document.getElementById('btn-stop-timer').style.display = 'none';
        }
    } catch (error) {
        console.error(error);
    }
}

async function startTimeTracking() {
    const taskId = document.getElementById('todo-id').value;
    try {
        const entry = await apiRequest(`/api/tasks/${taskId}/time/start`, 'POST');
        startTimerDisplay(new Date(entry.start_time));
        document.getElementById('btn-start-timer').style.display = 'none';
        document.getElementById('btn-stop-timer').style.display = 'inline-flex';
    } catch (error) {
        showNotification(error.message, 'error');
    }
}

async function stopTimeTracking() {
    const taskId = document.getElementById('todo-id').value;
    try {
        await apiRequest(`/api/tasks/${taskId}/time/stop`, 'POST');
        stopTimerDisplay();
        loadTimeEntries(taskId);
        document.getElementById('btn-start-timer').style.display = 'inline-flex';
        document.getElementById('btn-stop-timer').style.display = 'none';
    } catch (error) {
        showNotification(error.message, 'error');
    }
}

function startTimerDisplay(startTime) {
    if (timerInterval) clearInterval(timerInterval);
    const display = document.getElementById('timer-display');
    
    timerInterval = setInterval(() => {
        const now = new Date();
        const diff = Math.floor((now - startTime) / 1000);
        display.textContent = formatDuration(diff);
    }, 1000);
}

function stopTimerDisplay() {
    if (timerInterval) clearInterval(timerInterval);
    document.getElementById('timer-display').textContent = "00:00:00";
}

function formatDuration(seconds) {
    const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
}

// ==================== AI Suggestions ====================

async function aiSuggestSubtasks() {
    const title = document.getElementById('todo-title').value;
    const taskId = document.getElementById('todo-id').value;
    
    if (!title) {
        showNotification('Please enter a title first', 'warning');
        return;
    }
    
    const btn = document.querySelector('#ai-section button');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Thinking...';
    btn.disabled = true;
    
    try {
        const res = await apiRequest('/api/ai/suggest-subtasks', 'POST', { title });
        
        if (res.suggestions && res.suggestions.length > 0) {
            // Create subtasks
            for (const sub of res.suggestions) {
                await apiRequest('/api/todos', 'POST', {
                    title: sub,
                    parent_id: taskId,
                    status: 'pending'
                });
            }
            showNotification(`Created ${res.suggestions.length} subtasks from AI suggestions`);
            loadTodos(); // Refresh list
            closeModal(); // Close to see list or refresh modal? Better to close.
        }
    } catch (error) {
        showNotification('AI failed to generate suggestions', 'error');
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}

async function loadComments(taskId) {
    const container = document.getElementById('comments-list');
    container.innerHTML = '<div style="text-align:center; color: var(--text-muted);">Loading comments...</div>';
    
    try {
        const comments = await apiRequest(`/api/tasks/${taskId}/comments`);
        
        if (comments.length === 0) {
            container.innerHTML = '<div style="text-align:center; color: var(--text-muted); padding: 10px;">No comments yet.</div>';
            return;
        }
        
        container.innerHTML = comments.map(c => `
            <div class="comment-item" style="background: var(--bg-light); padding: 10px; border-radius: 8px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                    <strong style="color: var(--primary-color);">${escapeHtml(c.user.username)}</strong>
                    <span style="font-size: 0.8rem; color: var(--text-muted);">${formatDateTime(c.created_at)}</span>
                </div>
                <div style="font-size: 0.9rem;">${escapeHtml(c.content)}</div>
            </div>
        `).join('');
    } catch (error) {
        container.innerHTML = '<div style="color: var(--danger-color);">Failed to load comments</div>';
    }
}

async function postComment() {
    const input = document.getElementById('new-comment-input');
    const content = input.value.trim();
    const taskId = document.getElementById('todo-id').value;
    
    if (!content) return;
    
    try {
        await apiRequest(`/api/tasks/${taskId}/comments`, 'POST', { content });
        input.value = '';
        loadComments(taskId);
    } catch (error) {
        // Error already handled
    }
}

function addSubtask(parentId) {
    openTodoModal(null, parentId);
}

async function saveTodo(event) {
    event.preventDefault();
    
    const id = document.getElementById('todo-id').value;
    const parentId = document.getElementById('todo-parent-id').value;
    
    const data = {
        title: document.getElementById('todo-title').value,
        description: document.getElementById('todo-description').value,
        status: document.getElementById('todo-status').value,
        priority: document.getElementById('todo-priority').value,
        deadline: document.getElementById('todo-deadline').value || null,
        parent_id: parentId || null
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