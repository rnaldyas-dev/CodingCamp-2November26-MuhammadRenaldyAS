# Implementation Plan: Life Dashboard

## Overview

Build the Life Dashboard incrementally — foundation first (HTML structure + CSS framework + Storage helper), then each widget in isolation, then final integration and polish. All code lives in three files: `index.html`, `css/style.css`, and `js/script.js`. No build tools or frameworks are used.

## Tasks

- [ ] 1. Scaffold HTML structure and CSS foundation
  - Update `index.html` with the full page skeleton: `#app` grid wrapper containing four `<section>` widget containers (`#widget-greeting`, `#widget-timer`, `#widget-todo`, `#widget-links`) with all inner HTML for each widget.
  - Set `<title>` to "Life Dashboard".
  - In `css/style.css`, define CSS custom properties (color palette, spacing, typography) and a CSS reset. Implement the two-column CSS Grid layout for `#app` and the single-column media query breakpoint at 768 px. Add base widget card styles.
  - _Requirements: 9.1, 9.2, 9.3, 10.1, 10.2, 10.3_

- [ ] 2. Implement Storage module and Greeting widget
  - [ ] 2.1 Implement the `Storage` module
    - Write `Storage.get(key, defaultVal)` and `Storage.set(key, value)` with JSON serialisation and try/catch error handling in `js/script.js`.
    - _Requirements: 6.6, 8.5_

  - [ ] 2.2 Implement the `Greeting` / `Clock` module
    - Write `Greeting.init()`, `Greeting.tick()` (called by `setInterval` every 1 000 ms), `Greeting.startEdit()`, and `Greeting.commitEdit(value)`.
    - Implement greeting period logic: hours 5–11 → "morning", 12–17 → "afternoon", 18–4 → "evening".
    - Validate that submitted names are non-empty after `.trim()`; persist valid names to `dashboard_username`.
    - Restore name from `dashboard_username` on load; default to "World".
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 2.3, 2.4_

  - [ ]* 2.3 Verify Greeting properties manually
    - **Property 1: Username round-trip persistence** — In browser console: call `Greeting.commitEdit("Alice")`, then verify `Storage.get('dashboard_username','World') === 'Alice'`.
    - **Property 2: Whitespace username rejection** — Call `Greeting.commitEdit("   ")`, verify storage is unchanged.
    - **Validates: Requirements 2.3, 2.4**

- [ ] 3. Implement Focus Timer widget
  - [ ] 3.1 Implement `Timer` module — state and controls
    - Write `Timer.state` object, `Timer.init()`, `Timer.start()`, `Timer.pause()`, `Timer.reset()`, `Timer.tick()`, and `Timer.render()`.
    - Implement button enable/disable toggling (Start disabled while running; Pause disabled while stopped).
    - Restore `pomodoro_work_mins` and `pomodoro_break_mins` from storage on init.
    - Bind config `<input>` change events: clamp values to valid ranges; apply immediately if timer is stopped, defer to next session if running; persist to storage.
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 5.1, 5.2, 5.3, 5.4, 5.5_

  - [ ] 3.2 Implement `Timer.onSessionEnd()` and `Timer.playBeep()`
    - On session end: play Web Audio API beep (440 Hz sine wave, 0.3 s); switch mode (work↔break); reset remaining to new mode duration; auto-start next session.
    - Wrap `AudioContext` creation in try/catch; on failure add CSS class `flash` to `#timer-display` for visual fallback.
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

  - [ ]* 3.3 Verify Timer properties manually
    - **Property 3: Session-end mode transition** — With `Timer.state.mode = 'work'`, call `Timer.onSessionEnd()`, verify mode is now `'break'` and remaining equals `breakMins * 60`. Repeat for `'break'` → `'work'`.
    - **Property 4: Timer duration persistence round-trip** — Set work to 30, break to 10, verify `Storage.get('pomodoro_work_mins', 25) === 30`.
    - **Validates: Requirements 4.2, 4.3, 5.5**

- [ ] 4. Checkpoint — verify Greeting and Timer
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 5. Implement To-Do List widget
  - [ ] 5.1 Implement `Todo` module — CRUD and persistence
    - Write `Todo.tasks` array, `Todo.init()`, `Todo.add(description)`, `Todo.toggle(id)`, `Todo.remove(id)`, `Todo.save()`.
    - Validate that `description.trim()` is non-empty before adding.
    - Generate unique IDs using `Date.now().toString() + Math.random()`.
    - Persist to `dashboard_todos` after every mutation.
    - Restore from storage on init.
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.6, 6.7_

  - [ ] 5.2 Implement `Todo.render()` and filter controls
    - Render tasks filtered by `Todo.filter` ('all' | 'active' | 'completed').
    - Update count display: "X remaining / Y total".
    - Bind filter button clicks to update `Todo.filter` and re-render.
    - Each rendered task: checkbox (toggles completion), label (description, strikethrough if completed), delete button.
    - _Requirements: 6.5, 7.1, 7.2, 7.3, 7.4, 7.5_

  - [ ]* 5.3 Verify Todo properties manually
    - **Property 5: Task addition grows the list** — `Todo.add("Buy milk")`, verify `Todo.tasks.length` increased by 1 and last task has correct description and `completed === false`.
    - **Property 6: Whitespace task rejection** — `Todo.add("   ")`, verify `Todo.tasks.length` unchanged.
    - **Property 7: Toggle idempotence pair** — Toggle a task twice, verify `completed` equals original value.
    - **Property 8: Deletion removes only the target** — Add two tasks, delete first, verify second still present.
    - **Property 9: Todo list persistence round-trip** — Check `JSON.stringify(Storage.get('dashboard_todos',[]))` equals `JSON.stringify(Todo.tasks)`.
    - **Property 10: Filter partition invariant** — Verify `filter(active).length + filter(completed).length === filter(all).length`.
    - **Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.6, 7.2, 7.3, 7.4**

- [ ] 6. Implement Quick Links widget
  - [ ] 6.1 Implement `Links` module — CRUD and persistence
    - Write `Links.links` array, `Links.init()`, `Links.add(title, url, emoji)`, `Links.remove(id)`, `Links.save()`.
    - Validate that both `title.trim()` and `url.trim()` are non-empty before adding.
    - Each tile rendered as `<a href="url" target="_blank" rel="noopener noreferrer">`.
    - Add a remove button per tile (stops propagation to prevent navigation).
    - Persist to `dashboard_links` on every mutation; restore on init.
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6_

  - [ ]* 6.2 Verify Links properties manually
    - **Property 11: Link addition grows the grid** — `Links.add("GitHub","https://github.com","🐙")`, verify `Links.links.length` increased by 1.
    - **Property 12: Empty link rejection** — `Links.add("","https://github.com","")`, verify length unchanged.
    - **Property 13: Link deletion removes only the target** — Add two links, delete first, verify second still present.
    - **Property 14: Links persistence round-trip** — Verify `JSON.stringify(Storage.get('dashboard_links',[]))` equals `JSON.stringify(Links.links)`.
    - **Validates: Requirements 8.1, 8.2, 8.4, 8.5**

- [ ] 7. Checkpoint — verify To-Do and Quick Links
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 8. Wire up App bootstrap and apply full CSS styling
  - [~] 8.1 Implement `App.init()` and wire all modules
    - Write `App.init()` that calls `Greeting.init()`, `Timer.init()`, `Todo.init()`, `Links.init()` after `DOMContentLoaded`.
    - Expose modules on `window` during development for console testing.
    - _Requirements: 1.1, 3.1, 6.7, 8.6_

  - [ ] 8.2 Complete CSS for all widget internals
    - Style each widget: Greeting (large clock, editable name hover cue), Timer (large digit display, mode badge, control buttons, config inputs), Todo (task list items with checkbox, strikethrough completed, filter tab buttons, count badge), Quick Links (responsive tile grid, emoji + title layout, remove button overlay).
    - Add `flash` keyframe animation for Timer audio fallback.
    - Add hover, focus, and active state styles for all interactive elements.
    - Ensure mobile-friendly tap targets (min 44 × 44 px).
    - _Requirements: 9.1, 9.2, 9.3, 10.1, 10.2, 10.3_

- [ ] 9. Final checkpoint — full integration test
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional manual verification steps and can be skipped for faster delivery; the properties they check are enforced by implementation guard clauses.
- Each task references specific requirements for traceability.
- The single-file constraint (no framework, no test runner) means property verification is performed via browser console and manual interaction rather than automated test runs.
- All IDs generated with `Date.now().toString() + Math.random()` — sufficient for single-user in-browser use; not globally unique.

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1"] },
    { "id": 1, "tasks": ["2.1"] },
    { "id": 2, "tasks": ["2.2"] },
    { "id": 3, "tasks": ["2.3", "3.1"] },
    { "id": 4, "tasks": ["3.2"] },
    { "id": 5, "tasks": ["3.3", "5.1"] },
    { "id": 6, "tasks": ["5.2"] },
    { "id": 7, "tasks": ["5.3", "6.1"] },
    { "id": 8, "tasks": ["6.2", "8.1"] },
    { "id": 9, "tasks": ["8.2"] }
  ]
}
```
