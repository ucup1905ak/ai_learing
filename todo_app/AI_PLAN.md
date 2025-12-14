# AI Development Plan for Todo/Project Management App

This plan outlines the roadmap to transform the current simple Todo/Event application into a comprehensive Project Management system, as requested in `AGENTS.md`.

## Phase 1: Foundation & Core Architecture (Immediate Priority)
**Goal:** Refactor the codebase for scalability and implement advanced task features.

1.  **Refactoring & Cleanup**
    *   [ ] Split `app.py` into a modular structure (Blueprints for Auth, API, Views).
    *   [ ] Extract database logic into a dedicated Data Access Layer (DAL) or use an ORM (SQLAlchemy) for better manageability.
    *   [ ] Set up `Flask-Migrate` (Alembic) for database schema migrations.
    *   [ ] Consolidate "Todos" and "Events" into a unified "Items" or "Tasks" model where possible, or strictly define their relationships.

2.  **Advanced Task Management**
    *   [ ] **Subtasks:** Add `parent_id` to `todos` table to allow hierarchical tasks.
    *   [ ] **Checklists:** Create `checklist_items` table linked to parent todos.
    *   [ ] **Dependencies:** Create `task_dependencies` table (blocking/blocked by).
    *   [ ] **Recurring Tasks:** Add recurrence rules (CRON-style or interval-based) to tasks.
    *   [ ] **Priorities:** Expand priority system (currently text, maybe move to integer or lookup table).

## Phase 2: Views & Organization
**Goal:** Visualize data in different ways.

3.  **Kanban Board View**
    *   [ ] Create a frontend Kanban board (drag-and-drop) using existing API.
    *   [ ] Ensure status updates reflect in the database.
    *   [ ] Support custom statuses (beyond 'pending'/'completed').

4.  **Calendar Integration**
    *   [ ] Display Tasks with deadlines on the Calendar (alongside Events).
    *   [ ] Allow dragging tasks on the calendar to change due dates.

5.  **Gantt/Timeline View**
    *   [ ] Implement a visual timeline using task start/end dates and dependencies.

## Phase 3: Collaboration Features
**Goal:** Enhance team interaction.

6.  **Comments & Activity**
    *   [ ] Create `comments` table linked to Tasks/Events.
    *   [ ] Implement threaded discussions.
    *   [ ] Add activity log/audit trail (User X changed status Y).

7.  **Mentions & Notifications**
    *   [ ] Parse `@username` in comments/descriptions.
    *   [ ] Create a notification system (in-app + email hooks).

## Phase 4: Customization
**Goal:** Allow users to tailor the workflow.

8.  **Custom Fields**
    *   [ ] Implement a schema for dynamic custom fields (Text, Number, Date, Dropdown) attached to tasks.

9.  **Hierarchy**
    *   [ ] Introduce "Projects" or "Lists" to group tasks (currently just flat list per user).
    *   [ ] Add "Spaces" or "Folders" for higher-level organization.

## Phase 5: Time, Reporting & AI (Long Term)
**Goal:** Analytics and automation.

10. **Time Tracking**
    *   [ ] Add `time_entries` for tasks (start/stop timer or manual entry).
    *   [ ] Report generation (Time spent per project/user).

11. **AI Integration**
    *   [ ] Task breaking: AI suggests subtasks from a high-level description.
    *   [ ] Summarization: AI summarizes long comment threads.

12. **Automation**
    *   [ ] Simple "If this then that" rules (e.g., "When status is Done, move to Archive").

---

## Execution Strategy

We will proceed with **Phase 1** immediately upon approval.
1.  Initialize git repository (if not already robust).
2.  Refactor `app.py`.
3.  Implement Subtasks and Checklists.
