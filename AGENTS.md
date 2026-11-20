# FlowTask Agent Instructions

## Project overview

FlowTask (To-Do App Project 11) is a task-management web application. The intended product includes registration, login, user task management, task filtering and statistics, responsive UI, and separate admin management features. This repository currently contains a frontend prototype and a Flask/Jinja preview application; backend, database, and API implementation are not present in this checkout.

## Technology and architecture

- Frontend: HTML/Jinja templates, CSS, and browser JavaScript.
- Preview server: Python Flask in `frontend/preview_app.py`.
- Intended backend/database: Flask API and MySQL, but neither implementation is currently present.
- Template inheritance starts at `frontend/templates/base.html`.
- Static assets are under `frontend/static/css` and `frontend/static/js`.
- The preview server renders `/`, `/login`, and `/register`; it does not expose application APIs.

## Team responsibilities

- Paarth: team leadership and database development.
- Mayur: Flask backend.
- Om: UI/UX design.
- Hitesh: integration.
- Karishma: testing.
- Frontend work: frontend templates, CSS, and JavaScript only unless integration requires a documented, coordinated change.

Do not overwrite or modify another team member's work without a clear necessity. Explain such changes in the task report.

## Frontend conventions

- Inspect existing templates, styles, and scripts before editing.
- Preserve the existing indigo/purple design system, CSS variables, reusable classes, and responsive structure.
- Prefer small, surgical changes and existing components over redesigns or new dependencies.
- Keep client-only behavior clearly separate from server persistence.
- Registration must not expose a public admin-role selector.
- Keep accessibility behavior intact: labels, focus states, dialog semantics, keyboard handling, and usable mobile layouts.

## Backend integration rules

- Verify routes, payloads, response shapes, authentication, permissions, and database fields from actual backend source before integrating.
- Never invent endpoints, columns, token formats, status codes, or error payloads.
- Do not claim a task is saved until a verified backend integration exists.
- Treat user/task ownership and admin authorization as server-side responsibilities.
- Historical references in issue descriptions or documents are not API contracts.

## Git collaboration

- Work on the current feature branch unless the user explicitly authorizes otherwise.
- Do not switch branches, merge, rebase, commit, push, or rewrite history without explicit approval.
- Preserve unrelated worktree changes.
- Keep changes limited to the requested scope and avoid modifying backend/database directories during frontend work.

## Security

- Do not commit credentials, secrets, tokens, or private data.
- Do not trust client-side validation for authentication, authorization, ownership, or role assignment.
- Avoid exposing admin controls to public registration.
- Use secure, verified authentication and server-side authorization when backend integration is added.
- Report security-relevant uncertainty instead of filling gaps with assumptions.

## Testing and reporting

- Inspect existing code before modifying it.
- Run the smallest relevant checks after changes; use existing tooling and do not install dependencies unless explicitly required.
- Add focused tests only for behavior introduced or fixed.
- Before finishing, report the files changed, the behavior verified, the commands/tests run, and any missing or unverified implementation.
- Keep project documentation consistent with the actual repository, marking unknown or unimplemented behavior explicitly.

