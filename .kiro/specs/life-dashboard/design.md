# Design Document: Life Dashboard

## Overview

The Life Dashboard is a zero-dependency, single-page web application built with plain HTML5, CSS3, and Vanilla JavaScript. Four widgets — Greeting, Focus Timer, To-Do List, and Quick Links — are arranged in a responsive two-column CSS Grid. All persistent state lives in `window.localStorage`. The JavaScript is organised into self-contained module objects (one per widget plus a shared `Storage` helper) that communicate through direct function calls and DOM events.

---

## Architecture

```
index.html
├── <head>  — meta, title, link to css/style.css
└── <body>
    ├── #app  (CSS Grid wrapper)
    │   ├── #widget-greeting
    │   ├── #widget-timer
    │   ├── #widget-todo
    │   └── #widget-links
    └── <script src="js/script.js">
```

All JavaScript runs after `DOMContentLoaded`. There is no bundling or transpilation — the single `script.js` file is loaded as a classic script.

### Module Breakdown

| Module | Responsibility |
|---|---|
| `Storage` | Thin wrapper around `localStorage` — `get(key, defaultVal)`, `set(key, value)` |
| `Clock` | Live clock, date formatting, greeting period logic |
| `Greeting` | DOM updates for greeting widget; name edit flow |
| `Timer` | Pomodoro countdown state machine; Web Audio beep; mode switching |
| `Todo` | Task CRUD, filter state, count rendering |
| `Links` | Link-tile CRUD, grid rendering |
| `App` | Bootstrap: calls `init()` on each module after DOM ready |

---

## Components and Interfaces

### Storage Module

```js
const Storage = {
  get(key, defaultVal) { /* JSON.parse(localStorage.getItem(key)) ?? defaultVal */ },
  set(key, value)      { /* localStorage.setItem(key, JSON.stringify(value)) */ }
};
```

### Clock / Greeting Module

Greeting widget HTML skeleton:
```html
<section id="widget-greeting" class="widget">
  <div class="greeting-line">
    <span id="greeting-text"></span>
    <span id="greeting-name" class="editable-name"></span>
    <span>!</span>
  </div>
  <div id="greeting-date" class="greeting-date"></div>
  <div id="greeting-time" class="greeting-clock"></div>
</section>
```

Key functions:
- `Greeting.init()` — reads name from storage, starts clock tick, binds click-to-edit.
- `Greeting.tick()` — called every second via `setInterval`; updates time, date, greeting period.
- `Greeting.startEdit()` — replaces `#greeting-name` span with an `<input>`.
- `Greeting.commitEdit(value)` — validates (non-empty after trim), saves to storage, restores span.

### Focus Timer Module

Timer widget HTML skeleton:
```html
<section id="widget-timer" class="widget">
  <div id="timer-mode" class="timer-mode">Work</div>
  <div id="timer-display" class="timer-display">25:00</div>
  <div class="timer-controls">
    <button id="timer-start">Start</button>
    <button id="timer-pause" disabled>Pause</button>
    <button id="timer-reset">Reset</button>
  </div>
  <div class="timer-config">
    <label>Work <input id="cfg-work" type="number" min="1" max="60" value="25"> min</label>
    <label>Break <input id="cfg-break" type="number" min="1" max="30" value="5"> min</label>
  </div>
</section>
```

State object:
```js
Timer.state = {
  mode: 'work',          // 'work' | 'break'
  remaining: 1500,       // seconds
  running: false,
  workMins: 25,
  breakMins: 5,
  intervalId: null
};
```

Key functions:
- `Timer.init()` — loads config from storage, renders display, binds buttons and config inputs.
- `Timer.start()` — sets `running = true`, starts `setInterval(Timer.tick, 1000)`.
- `Timer.pause()` — clears interval, sets `running = false`.
- `Timer.reset()` — clears interval, resets `remaining` to current mode's duration.
- `Timer.tick()` — decrements `remaining`; calls `Timer.onSessionEnd()` when it reaches 0.
- `Timer.onSessionEnd()` — plays beep, switches mode, resets remaining, auto-starts next session.
- `Timer.playBeep()` — creates `AudioContext`, plays a short 440 Hz sine wave tone.
- `Timer.render()` — formats `remaining` as MM:SS, updates DOM, toggles button states.

### To-Do List Module

Todo widget HTML skeleton:
```html
<section id="widget-todo" class="widget">
  <h2>To-Do</h2>
  <div class="todo-add">
    <input id="todo-input" type="text" placeholder="Add a task…">
    <button id="todo-add-btn">Add</button>
  </div>
  <div class="todo-filters">
    <button class="filter-btn active" data-filter="all">All</button>
    <button class="filter-btn" data-filter="active">Active</button>
    <button class="filter-btn" data-filter="completed">Completed</button>
  </div>
  <div id="todo-count" class="todo-count"></div>
  <ul id="todo-list"></ul>
</section>
```

Key functions:
- `Todo.init()` — loads tasks from storage, renders list, binds add button and filter buttons.
- `Todo.add(description)` — validates, creates task object `{id, description, completed}`, appends, saves.
- `Todo.toggle(id)` — flips `completed` on matching task, saves, renders.
- `Todo.remove(id)` — filters out task by id, saves, renders.
- `Todo.render()` — applies current filter, builds list DOM, updates count display.
- `Todo.save()` — calls `Storage.set('dashboard_todos', Todo.tasks)`.

### Quick Links Module

Links widget HTML skeleton:
```html
<section id="widget-links" class="widget">
  <h2>Quick Links</h2>
  <div class="links-add">
    <input id="link-emoji" type="text" placeholder="😀" maxlength="2">
    <input id="link-title" type="text" placeholder="Title">
    <input id="link-url"   type="url"  placeholder="https://…">
    <button id="link-add-btn">Add</button>
  </div>
  <div id="links-grid" class="links-grid"></div>
</section>
```

Key functions:
- `Links.init()` — loads links from storage, renders grid, binds add button.
- `Links.add(title, url, emoji)` — validates non-empty title and url, creates `{id, title, url, emoji}`, appends, saves.
- `Links.remove(id)` — filters out by id, saves, renders.
- `Links.render()` — builds grid DOM; each tile is an `<a>` with `target="_blank" rel="noopener noreferrer"` plus a delete button.
- `Links.save()` — calls `Storage.set('dashboard_links', Links.links)`.

---

## Data Models

### LocalStorage Schema

| Key | Type | Description |
|---|---|---|
| `dashboard_username` | `string` | User's display name. Default: `"World"`. |
| `pomodoro_work_mins` | `number` | Work session duration in minutes. Default: `25`. |
| `pomodoro_break_mins` | `number` | Break session duration in minutes. Default: `5`. |
| `dashboard_todos` | `Task[]` | Array of task objects. Default: `[]`. |
| `dashboard_links` | `LinkTile[]` | Array of link tile objects. Default: `[]`. |

### Task Object

```js
{
  id: string,          // crypto.randomUUID() or Date.now().toString()
  description: string, // non-empty
  completed: boolean   // false on creation
}
```

### LinkTile Object

```js
{
  id: string,    // unique identifier
  title: string, // display label
  url: string,   // full URL
  emoji: string  // optional, '' if omitted
}
```

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

> **Note on testing context**: This project uses no test framework (constraint in requirements). The properties below are formal correctness specifications that guide implementation correctness and can be verified manually or with a simple browser-console test harness. They follow property-based testing conventions and are designed to be convertible to automated tests if a framework is added later.

### Property 1: Username round-trip persistence

*For any* non-empty, non-whitespace-only string used as a username, writing it to `LocalStorage` via `Greeting.commitEdit` and then reading it back via `Storage.get('dashboard_username', 'World')` shall return a value equal to the original string.

**Validates: Requirements 2.3**

### Property 2: Whitespace username rejection

*For any* string composed entirely of whitespace characters (spaces, tabs, newlines), calling `Greeting.commitEdit` with that string shall leave `LocalStorage['dashboard_username']` unchanged from its value before the call.

**Validates: Requirements 2.4**

### Property 3: Timer session-end mode transition

*For any* valid timer state where `mode` is either `'work'` or `'break'` and `remaining` reaches 0, calling `Timer.onSessionEnd()` shall result in `mode` being the opposite value and `remaining` being set to the duration of the new mode in seconds.

**Validates: Requirements 4.2, 4.3**

### Property 4: Timer duration persistence round-trip

*For any* valid `workMins` in [1, 60] and `breakMins` in [1, 30], saving them via `Timer` configuration and then loading them via `Storage.get` shall return the same values.

**Validates: Requirements 5.5**

### Property 5: Task addition grows the list

*For any* non-empty task description and any existing task list state, calling `Todo.add(description)` shall result in a task list with exactly one more entry than before, and the new entry shall have a `description` matching the input and `completed` equal to `false`.

**Validates: Requirements 6.1**

### Property 6: Whitespace task rejection

*For any* string composed entirely of whitespace characters, calling `Todo.add` with that string shall leave the task list unchanged (same length, same contents).

**Validates: Requirements 6.2**

### Property 7: Task completion toggle idempotence pair

*For any* task in the list, toggling `completed` twice via `Todo.toggle` shall result in the task's `completed` state being equal to its state before either toggle.

**Validates: Requirements 6.3**

### Property 8: Task deletion removes exactly the target

*For any* task list containing at least one task with a given `id`, calling `Todo.remove(id)` shall result in a task list that contains no task with that `id`, and all other tasks remain present and unchanged.

**Validates: Requirements 6.4**

### Property 9: Todo list persistence round-trip

*For any* task list (including empty), serialising it to LocalStorage via `Todo.save()` and then deserialising it via `Storage.get('dashboard_todos', [])` shall produce an array equal in length and content to the original.

**Validates: Requirements 6.6**

### Property 10: Filter partition invariant

*For any* task list, the union of tasks returned by the `'active'` filter and tasks returned by the `'completed'` filter shall be equal to the full set of tasks returned by the `'all'` filter (no tasks lost or duplicated).

**Validates: Requirements 7.2, 7.3, 7.4**

### Property 11: Link addition grows the grid

*For any* non-empty title and non-empty URL, calling `Links.add(title, url, emoji)` shall result in a links array with exactly one more entry than before, containing a tile whose `title` and `url` match the inputs.

**Validates: Requirements 8.1**

### Property 12: Empty link rejection

*For any* call to `Links.add` where title or URL is an empty or whitespace-only string, the links array shall remain unchanged (same length, same contents).

**Validates: Requirements 8.2**

### Property 13: Link deletion removes exactly the target

*For any* links list containing a tile with a given `id`, calling `Links.remove(id)` shall result in a list with no tile of that `id`, and all other tiles remain present and unchanged.

**Validates: Requirements 8.4**

### Property 14: Links persistence round-trip

*For any* links list, serialising it via `Links.save()` and deserialising via `Storage.get('dashboard_links', [])` shall produce an array equal in length and content to the original.

**Validates: Requirements 8.5, 8.6**

---

## Error Handling

| Scenario | Handling |
|---|---|
| `localStorage` unavailable (private mode, quota exceeded) | `Storage.set` wraps in try/catch; logs warning to console; UI continues working in-memory for the session |
| `AudioContext` unavailable or suspended | `Timer.playBeep` wraps in try/catch; falls back to CSS `flash` animation class on `#timer-display` |
| Invalid URL in Quick Links input | Browser native URL validation on `<input type="url">` prevents submission; duplicate check skipped for simplicity |
| Malformed JSON in localStorage | `Storage.get` wraps `JSON.parse` in try/catch; returns `defaultVal` on error |
| Config inputs out of range | `<input type="number" min max>` enforced by browser; JS clamps on `change` event as defence-in-depth |

---

## Testing Strategy

Given the project constraint of no test framework, correctness is validated via:

1. **Manual console testing**: Each module exposes its state and functions on the global scope during development; properties above can be exercised in the browser console.
2. **Property-guided implementation**: Properties 1–14 directly inform guard clauses, validation logic, and state transitions written in implementation.
3. **Example-based manual tests**: Each acceptance criterion from Requirements 1–10 is verified by interacting with the running page in the browser.
4. **Cross-browser smoke test**: Load the page in Chrome, Firefox, Edge, and Safari; verify all four widgets render and function.

If a test framework is added later, the properties map directly to test cases using any property-based library (e.g., `fast-check` for JavaScript).
