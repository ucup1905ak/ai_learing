# AGENTS.md

## Build / Run / Test

* Run app (dev): python todo\_app/app.py
* Run in Docker: docker build -t todo-app . \&\& docker run -p 5000:5000 todo-app
* Recommended test runner: pytest (pip install pytest)
* Run all tests: pytest
* Run a single test: pytest tests/test\_file.py::test\_name -q
* Run a single test by class/method: pytest path/to/test\_file.py::TestClass::test\_method -q
* Run tests by keyword: pytest -k 'keyword' -q
* Lint / format (recommended): ruff check . \&\& black . \&\& isort .

## Code Style Guidelines

* Python 3.12, Flask app under todo\_app/
* Use sqlite3 with parameterized queries and context managers
* Imports: stdlib, third-party, local; prefer absolute imports
* Naming: snake\_case for functions/variables; PascalCase for classes; UPPER\_SNAKE for constants
* Use 4-space indentation, follow Black formatting, add type hints where practical
* Use docstrings for functions; keep route handlers small and organized by feature
* Error handling: use try/except, flash friendly messages; log tracebacks with logging.exception without leaking secrets
* No .cursor/rules or .github/copilot-instructions.md found in repo
  
  ---

New Improvements / Roadmap:
- Fix inconsistent theme/UI: centralize CSS variables and unify button/input styles; add template tests
- Improve UI consistency: standardize component classes, spacing and colors; add visual regression checks
- Implement features incrementally: Kanban board → Gantt/timeline → Alerts/Notifications → User profiles (avatar, status, contacts); add routes & tests per feature
- Pre-PR checklist: run ruff/black/isort, run pytest, add tests, update README/CHANGELOG

ClickUp Features List (ASCII text only)

TASK AND PROJECT MANAGEMENT

\* Tasks and subtasks

\* Task dependencies

\* Recurring tasks

\* Checklists

\* Task priorities

\* Custom statuses

\* Custom fields

\* Task templates

\* Milestones

VIEWS AND ORGANIZATION

\* List view

\* Board (Kanban) view

\* Calendar view

\* Gantt chart

\* Timeline view

\* Table view

\* Mind maps

\* Whiteboards

\* Everything view

COLLABORATION AND COMMUNICATION

\* Comments and threaded discussions

\* Mentions (@users and @tasks)

\* Assigned comments

\* Collaborative documents (Docs)

\* Real-time editing

\* Whiteboard collaboration

TIME AND PRODUCTIVITY

\* Time tracking (manual and automatic)

\* Timesheets

\* Time estimates

\* Workload management

\* Goals and OKRs

\* Productivity reports

REPORTING AND ANALYTICS

\* Dashboards

\* Custom widgets

\* Progress tracking

\* Burnup and burndown charts

\* Team performance reports

AUTOMATION AND AI

\* No-code automations

\* Automation templates

\* ClickUp AI (writing, summaries, task generation)

INTEGRATIONS AND EXTENSIBILITY

\* Third-party integrations (Slack, Google Drive, GitHub, etc.)

\* API access

\* Webhooks

\* Email integration

\* Import and export tools

CUSTOMIZATION AND CONTROL

\* Spaces, folders, and lists hierarchy

\* Permissions and roles

\* Custom task types

\* Custom views

\* Branding options (Enterprise)

SECURITY AND ADMINISTRATION

\* Single sign-on (SSO)

\* Two-factor authentication

\* Audit logs (Enterprise)

\* Data encryption

\* Admin controls







