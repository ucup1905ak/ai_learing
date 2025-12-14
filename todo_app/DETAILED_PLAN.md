# Detailed UI & Architecture Plan

This document details the technical implementation strategy for the roadmap defined in `AI_PLAN.md`.

## 1. Design System & Frontend Architecture

**Theme Philosophy:** "Neon Cyberpunk / Dark Modern".
**Core Colors:**
-   Background: `#050505` (Deep Black)
-   Primary Accent: `#00f3ff` (Cyan Neon)
-   Secondary Accent: `#bc13fe` (Purple Neon)
-   Glassmorphism: `rgba(255, 255, 255, 0.05)` background with `backdrop-filter: blur(10px)`.

### UI Component Updates

1.  **Layout Structure**
    *   **Sidebar:** Retain current distinct sidebar but add a "Minimize" toggle. Active state should be a glowing left-border using the primary neon color.
    *   **Main Content Area:** Use a subtle gradient overlay to give depth.
    *   **Modals:** Replace standard browser alerts with custom "Glass" modals (already partially present, need standardization).

2.  **New Components**
    *   **Task Card (Kanban/List):**
        *   Dark card (`#111`) with a subtle border glow on hover.
        *   Progress bar for subtasks (e.g., "3/5 subtasks").
        *   Avatars for assignees.
    *   **Gantt Chart Container:**
        *   Horizontal scrolling area with a time-axis header.
        *   Tasks represented as neon-colored horizontal bars.
    *   **Floating Action Button (FAB):**
        *   Bottom-right glowing button for "Quick Add Task".

3.  **Interaction Patterns**
    *   **Drag & Drop:** Use HTML5 Drag and Drop API or a lightweight library (like `SortableJS`) for Kanban and Subtask reordering.
    *   **Optimistic UI:** When a user checks a box, update the UI immediately before the API responds. Revert if it fails.
    *   **HTMX / Fetch:** We will continue using `fetch` for API calls to keep the app a Single Page Application (SPA) feel within a Multi-Page Application (MPA) shell.

---

## 2. Backend Architecture

We will move from a single `app.py` to a modular **Application Factory** pattern.

### Directory Structure
```text
todo_app/
├── app/
│   ├── __init__.py          # App factory, DB init
│   ├── models/              # SQLAlchemy Models
│   │   ├── __init__.py
│   │   ├── user.py
│   │   ├── task.py          # Includes Task, Checklist, Dependency
│   │   └── project.py       # New: Group tasks into projects
│   ├── api/                 # REST API Blueprints
│   │   ├── __init__.py
│   │   ├── tasks.py
│   │   └── projects.py
│   ├── auth/                # Auth routes
│   │   ├── __init__.py
│   │   └── routes.py
│   ├── views/               # Frontend rendering routes
│   │   ├── __init__.py
│   │   └── main.py
│   └── services/            # Business Logic Layer (optional but recommended)
│       └── task_service.py
├── migrations/              # Alembic migrations (Flask-Migrate)
├── static/
├── templates/
├── config.py                # Config classes (Dev, Prod, Test)
└── run.py                   # Entry point
```

### Database Schema Changes (SQLAlchemy)

**1. Users (Existing)**
*   `id`, `username`, `email`, `password_hash`

**2. Projects (New)**
*   `id`, `title`, `description`, `owner_id`, `color`

**3. Tasks (Refactored 'todos')**
*   `id`
*   `title`, `description`
*   `status` (Enum: pending, in_progress, completed, archived)
*   `priority` (Integer: 1=Low, 2=Med, 3=High, 4=Urgent)
*   `deadline` (DateTime)
*   `project_id` (ForeignKey -> Projects)
*   `parent_id` (ForeignKey -> Tasks, Nullable) - **For Subtasks**
*   `order` (Integer) - **For Kanban ordering**

**4. TaskDependencies (New)**
*   `blocker_id` (FK -> Tasks)
*   `blocked_id` (FK -> Tasks)

**5. Comments (New)**
*   `id`, `task_id`, `user_id`, `content`, `created_at`

### Technology Stack Updates
*   **ORM:** `Flask-SQLAlchemy` (Replace raw SQLite cursors for maintainability).
*   **Migrations:** `Flask-Migrate`.
*   **Serialization:** `Marshmallow` (for cleaner JSON APIs).

---

## 3. Implementation Steps (Phase 1 Refactoring)

1.  **Setup Environment:** Install `flask-sqlalchemy`, `flask-migrate`.
2.  **Scaffold Structure:** Create the folders defined above.
3.  **Port Models:** Rewrite `init_db` logic into SQLAlchemy classes in `app/models/`.
4.  **Port Routes:** Move routes from `app.py` to their respective Blueprints.
5.  **Data Migration:** Create a script to migrate data from the old `todo_app.sqlite` to the new schema if necessary (or just reset if acceptable).
6.  **Verify:** Ensure login, dashboard, and API endpoints work exactly as before but on the new architecture.

## 4. Implementation Steps (Phase 1 Features - Subtasks)**

1.  **Backend:** Add `parent_id` to Task model. Update `create_task` and `get_tasks` APIs to handle hierarchy.
2.  **Frontend:**
    *   Update Task Modal to show "Add Subtask" button.
    *   Update List View to show indentations or a "Show Subtasks" toggle.
