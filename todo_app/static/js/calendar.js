/**
 * Calendar JavaScript
 * Handles calendar display, navigation, and event CRUD operations
 */

let events = [];
let currentDate = new Date();
let todosForCalendar = [];

// ==================== Initialization ====================

document.addEventListener('DOMContentLoaded', () => {
    loadCalendarData();
    setupCalendarNavigation();
});

function setupCalendarNavigation() {
    document.getElementById('prev-month')?.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() - 1);
        renderCalendar();
    });
    
    document.getElementById('next-month')?.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() + 1);
        renderCalendar();
    });
    
    document.getElementById('today-btn')?.addEventListener('click', () => {
        currentDate = new Date();
        renderCalendar();
    });
}

// ==================== Load Data ====================

async function loadCalendarData() {
    try {
        const [eventsData, todosData] = await Promise.all([
            apiRequest('/api/events'),
            apiRequest('/api/todos')
        ]);
        
        events = eventsData;
        todosForCalendar = todosData.filter(t => t.deadline);
        
        renderCalendar();
        renderUpcomingEvents();
    } catch (error) {
        console.error('Failed to load calendar data:', error);
    }
}

// ==================== Calendar Rendering ====================

function renderCalendar() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    // Update header
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                        'July', 'August', 'September', 'October', 'November', 'December'];
    document.getElementById('current-month').textContent = `${monthNames[month]} ${year}`;
    
    // Get first day and total days
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const totalDays = lastDay.getDate();
    const startingDay = firstDay.getDay();
    
    // Get previous month days
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    
    const container = document.getElementById('calendar-days');
    container.innerHTML = '';
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Previous month days
    for (let i = startingDay - 1; i >= 0; i--) {
        const dayNum = prevMonthLastDay - i;
        const dayDate = new Date(year, month - 1, dayNum);
        container.appendChild(createDayElement(dayNum, dayDate, true));
    }
    
    // Current month days
    for (let day = 1; day <= totalDays; day++) {
        const dayDate = new Date(year, month, day);
        const isToday = dayDate.getTime() === today.getTime();
        container.appendChild(createDayElement(day, dayDate, false, isToday));
    }
    
    // Next month days
    const remainingDays = 42 - (startingDay + totalDays);
    for (let day = 1; day <= remainingDays; day++) {
        const dayDate = new Date(year, month + 1, day);
        container.appendChild(createDayElement(day, dayDate, true));
    }
}

function createDayElement(dayNum, date, isOtherMonth, isToday = false) {
    const dayEl = document.createElement('div');
    dayEl.className = 'calendar-day';
    
    if (isOtherMonth) dayEl.classList.add('other-month');
    if (isToday) dayEl.classList.add('today');
    
    // Get events and todos for this day
    const dayEvents = getEventsForDate(date);
    const dayTodos = getTodosForDate(date);
    
    if (dayEvents.length > 0 || dayTodos.length > 0) {
        dayEl.classList.add('has-events');
    }
    
    let eventsHtml = '';
    const allItems = [...dayEvents.map(e => ({ ...e, type: 'event' })), 
                      ...dayTodos.map(t => ({ ...t, type: 'todo', color: '#f39c12' }))];
    
    const displayItems = allItems.slice(0, 2);
    const moreCount = allItems.length - displayItems.length;
    
    displayItems.forEach(item => {
        eventsHtml += `<div class="day-event ${item.type}" style="background: ${item.color}">${escapeHtml(truncate(item.title, 15))}</div>`;
    });
    
    if (moreCount > 0) {
        eventsHtml += `<div class="day-more">+${moreCount} more</div>`;
    }
    
    dayEl.innerHTML = `
        <div class="day-number">${dayNum}</div>
        <div class="day-events">${eventsHtml}</div>
    `;
    
    dayEl.addEventListener('click', () => openDayDetail(date, allItems));
    
    return dayEl;
}

function getEventsForDate(date) {
    const dateStr = date.toISOString().split('T')[0];
    
    return events.filter(event => {
        const startDate = new Date(event.start).toISOString().split('T')[0];
        const endDate = event.end ? new Date(event.end).toISOString().split('T')[0] : startDate;
        return dateStr >= startDate && dateStr <= endDate;
    });
}

function getTodosForDate(date) {
    const dateStr = date.toISOString().split('T')[0];
    
    return todosForCalendar.filter(todo => {
        const deadlineDate = new Date(todo.deadline).toISOString().split('T')[0];
        return dateStr === deadlineDate;
    });
}

// ==================== Upcoming Events ====================

function renderUpcomingEvents() {
    const container = document.getElementById('upcoming-list');
    const now = new Date();
    
    // Combine events and todo deadlines
    const allItems = [
        ...events.map(e => ({
            ...e,
            type: 'event',
            date: new Date(e.start)
        })),
        ...todosForCalendar.filter(t => t.status !== 'completed').map(t => ({
            id: t.id,
            title: t.title,
            description: t.description,
            type: 'deadline',
            date: new Date(t.deadline),
            color: '#e74c3c'
        }))
    ].filter(item => item.date >= now)
     .sort((a, b) => a.date - b.date)
     .slice(0, 10);
    
    if (allItems.length === 0) {
        container.innerHTML = `
            <div class="empty-state" style="padding: 30px;">
                <i class="fas fa-calendar-check"></i>
                <h3>No upcoming events</h3>
                <p>Create an event or add deadlines to your tasks</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = allItems.map(item => {
        const date = item.date;
        const day = date.getDate();
        const month = date.toLocaleDateString('en-US', { month: 'short' });
        
        return `
            <div class="event-item" style="border-left-color: ${item.color || '#3498db'}" 
                 onclick="${item.type === 'event' ? `openEventModal(${item.id})` : `window.location.href='/dashboard'`}">
                <div class="event-date">
                    <div class="day">${day}</div>
                    <div class="month">${month}</div>
                </div>
                <div class="event-details">
                    <h4>
                        ${escapeHtml(item.title)}
                        <span class="event-type ${item.type}">${item.type === 'event' ? 'Event' : 'Deadline'}</span>
                    </h4>
                    ${item.type === 'event' && !item.allDay ? `
                        <div class="event-time">
                            <i class="fas fa-clock"></i>
                            ${formatTime(item.start)}${item.end ? ` - ${formatTime(item.end)}` : ''}
                        </div>
                    ` : ''}
                    ${item.location ? `
                        <div class="event-location">
                            <i class="fas fa-map-marker-alt"></i>
                            ${escapeHtml(item.location)}
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }).join('');
}

// ==================== Day Detail Modal ====================

function openDayDetail(date, items) {
    const dateStr = date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
    
    let content = `<div class="day-detail">`;
    
    if (items.length === 0) {
        content += `
            <p style="color: var(--text-muted); text-align: center; padding: 20px;">
                No events or deadlines on this day
            </p>
        `;
    } else {
        content += `<div class="day-events-list">`;
        items.forEach(item => {
            content += `
                <div class="day-event-item" onclick="${item.type === 'event' ? `closeModal(); setTimeout(() => openEventModal(${item.id}), 100)` : `window.location.href='/dashboard'`}">
                    <div class="event-color-dot" style="background: ${item.color || '#3498db'}"></div>
                    <div class="day-event-info">
                        <h4>${escapeHtml(item.title)}</h4>
                        <span>${item.type === 'event' ? (item.allDay ? 'All day' : formatTime(item.start)) : 'Task Deadline'}</span>
                    </div>
                    <span class="event-type ${item.type}">${item.type === 'event' ? 'Event' : 'Deadline'}</span>
                </div>
            `;
        });
        content += `</div>`;
    }
    
    content += `
        <div class="form-actions">
            <button class="btn btn-secondary" onclick="closeModal()">Close</button>
            <button class="btn btn-primary" onclick="closeModal(); setTimeout(() => openEventModal(null, '${date.toISOString()}'), 100)">
                <i class="fas fa-plus"></i> Add Event
            </button>
        </div>
    </div>`;
    
    openModal(dateStr, content);
}

// ==================== Event Modal ====================

function openEventModal(eventId = null, defaultDate = null) {
    const template = document.getElementById('event-form-template');
    const content = template.content.cloneNode(true);
    
    const title = eventId ? 'Edit Event' : 'Add New Event';
    openModal(title, content);
    
    if (eventId) {
        const event = events.find(e => e.id === eventId);
        if (event) {
            document.getElementById('event-id').value = event.id;
            document.getElementById('event-title').value = event.title;
            document.getElementById('event-description').value = event.description || '';
            document.getElementById('event-allday').checked = event.allDay;
            document.getElementById('event-start').value = toLocalDateTimeString(event.start);
            if (event.end) {
                document.getElementById('event-end').value = toLocalDateTimeString(event.end);
            }
            document.getElementById('event-color').value = event.color || '#3498db';
            document.getElementById('event-location').value = event.location || '';
            document.getElementById('event-reminder').value = event.reminder || 0;
            
            document.getElementById('delete-event-btn').style.display = 'inline-flex';
            
            toggleTimeInputs();
        }
    } else if (defaultDate) {
        const date = new Date(defaultDate);
        date.setHours(9, 0, 0, 0);
        document.getElementById('event-start').value = toLocalDateTimeString(date);
    }
}

function toggleTimeInputs() {
    const allDay = document.getElementById('event-allday').checked;
    const startInput = document.getElementById('event-start');
    const endInput = document.getElementById('event-end');
    
    if (allDay) {
        startInput.type = 'date';
        endInput.type = 'date';
        startInput.value = startInput.value.split('T')[0];
        endInput.value = endInput.value.split('T')[0];
    } else {
        startInput.type = 'datetime-local';
        endInput.type = 'datetime-local';
    }
}

async function saveEvent(event) {
    event.preventDefault();
    
    const id = document.getElementById('event-id').value;
    const allDay = document.getElementById('event-allday').checked;
    
    let startValue = document.getElementById('event-start').value;
    let endValue = document.getElementById('event-end').value;
    
    // If all day, append time
    if (allDay && !startValue.includes('T')) {
        startValue += 'T00:00:00';
        if (endValue) endValue += 'T23:59:59';
    }
    
    const data = {
        title: document.getElementById('event-title').value,
        description: document.getElementById('event-description').value,
        allDay: allDay,
        start: startValue,
        end: endValue || null,
        color: document.getElementById('event-color').value,
        location: document.getElementById('event-location').value,
        reminder: parseInt(document.getElementById('event-reminder').value)
    };
    
    try {
        if (id) {
            await apiRequest(`/api/events/${id}`, 'PUT', data);
            showNotification('Event updated successfully');
        } else {
            await apiRequest('/api/events', 'POST', data);
            showNotification('Event created successfully');
        }
        
        closeModal();
        loadCalendarData();
    } catch (error) {
        // Error already shown
    }
}

async function deleteEvent() {
    const id = document.getElementById('event-id').value;
    if (!id) return;
    
    if (!confirm('Are you sure you want to delete this event?')) return;
    
    try {
        await apiRequest(`/api/events/${id}`, 'DELETE');
        showNotification('Event deleted successfully');
        closeModal();
        loadCalendarData();
    } catch (error) {
        // Error already shown
    }
}
