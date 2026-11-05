# Requirements Document

## Introduction

The Life Dashboard is a single-page personal productivity web application composed of four widgets: a Greeting Widget, a Focus Timer (Pomodoro), a To-Do List, and a Quick Links grid. All data is persisted in the browser's LocalStorage. The application is built with plain HTML, CSS, and Vanilla JavaScript — no frameworks, no build tools, no backend.

## Glossary

- **Dashboard**: The single-page application containing all four widgets.
- **Greeting_Widget**: The top-level widget showing a time-based greeting, editable user name, and live clock.
- **Focus_Timer**: The Pomodoro countdown timer widget.
- **Todo_List**: The task management widget.
- **Quick_Links**: The user-defined bookmark grid widget.
- **LocalStorage**: The browser's `window.localStorage` API used for client-side data persistence.
- **Session**: A single work or break period in the Focus_Timer.
- **Task**: A to-do item with a description and a completion state.
- **Link_Tile**: A single bookmark entry in the Quick_Links grid, containing a title, URL, and optional emoji icon.

---

## Requirements

### Requirement 1: Greeting Widget — Display

**User Story:** As a user, I want to see a personalised time-based greeting with the current date and time, so that I can feel oriented and welcomed when I open the dashboard.

#### Acceptance Criteria

1. WHEN the Dashboard loads, THE Greeting_Widget SHALL display a greeting message in the format "Good [period], [Name]!" where [period] is "morning" for hours 05–11, "afternoon" for hours 12–17, and "evening" for hours 18–04.
2. WHEN the Dashboard loads, THE Greeting_Widget SHALL display the current date formatted as a long weekday, day, month, and year (e.g., "Monday, 5 January 2026").
3. WHILE the Dashboard is open, THE Greeting_Widget SHALL update the displayed time every second to show hours, minutes, and seconds in HH:MM:SS format.
4. WHEN the hour changes while the Dashboard is open, THE Greeting_Widget SHALL update the greeting period (morning/afternoon/evening) to reflect the new hour.

### Requirement 2: Greeting Widget — Name Editing

**User Story:** As a user, I want to set and change my name in the greeting, so that the dashboard feels personalised to me.

#### Acceptance Criteria

1. WHEN the Dashboard loads for the first time with no name stored in LocalStorage, THE Greeting_Widget SHALL display "World" as the default name.
2. WHEN a user clicks on the displayed name in the greeting, THE Greeting_Widget SHALL replace the name text with an inline editable input field pre-filled with the current name.
3. WHEN a user submits the name input by pressing Enter or by the input losing focus, THE Greeting_Widget SHALL save the new name to LocalStorage under the key `dashboard_username` and update the greeting display.
4. IF a user submits an empty or whitespace-only name, THEN THE Greeting_Widget SHALL retain the previous name without updating LocalStorage.

### Requirement 3: Focus Timer — Display and Controls

**User Story:** As a user, I want a Pomodoro countdown timer with start, pause, and reset controls, so that I can manage my focus sessions and breaks.

#### Acceptance Criteria

1. WHEN the Dashboard loads, THE Focus_Timer SHALL display a countdown initialised to the configured work duration (default 25 minutes) in MM:SS format.
2. WHEN a user clicks Start, THE Focus_Timer SHALL begin counting down one second at a time.
3. WHEN a user clicks Pause while the timer is running, THE Focus_Timer SHALL stop counting down and retain the current remaining time.
4. WHEN a user clicks Reset, THE Focus_Timer SHALL stop counting down and reset the displayed time to the current session mode's configured duration.
5. WHILE the timer is running, THE Focus_Timer SHALL disable the Start button and enable the Pause button.
6. WHILE the timer is paused or stopped, THE Focus_Timer SHALL enable the Start button and disable the Pause button.
7. THE Focus_Timer SHALL display the current session mode as either "Work" or "Break".

### Requirement 4: Focus Timer — Session Transitions

**User Story:** As a user, I want the timer to automatically switch between work and break modes and signal session completion, so that I can follow the Pomodoro technique without manually resetting.

#### Acceptance Criteria

1. WHEN the countdown reaches zero, THE Focus_Timer SHALL play an audible tone (Web Audio API beep) to signal session completion.
2. WHEN the countdown reaches zero and the current mode is "Work", THE Focus_Timer SHALL switch to "Break" mode and reset the countdown to the configured break duration (default 5 minutes).
3. WHEN the countdown reaches zero and the current mode is "Break", THE Focus_Timer SHALL switch to "Work" mode and reset the countdown to the configured work duration.
4. WHEN the session mode switches automatically, THE Focus_Timer SHALL start counting down the new session immediately.
5. IF the browser cannot produce audio output, THEN THE Focus_Timer SHALL display a visual flash animation on the timer display as an alternative cue.

### Requirement 5: Focus Timer — Configuration

**User Story:** As a user, I want to configure the work and break durations, so that I can adapt the timer to my personal workflow.

#### Acceptance Criteria

1. THE Focus_Timer SHALL provide input controls that allow the user to set the work duration in whole minutes from 1 to 60.
2. THE Focus_Timer SHALL provide input controls that allow the user to set the break duration in whole minutes from 1 to 30.
3. WHEN a user changes a duration value and the timer is not running, THE Focus_Timer SHALL apply the new duration immediately and update the countdown display if the affected session mode is active.
4. WHEN a user changes a duration value while the timer is running, THE Focus_Timer SHALL store the new duration and apply it on the next session reset or mode switch, without interrupting the running countdown.
5. THE Focus_Timer SHALL persist the configured work and break durations in LocalStorage under the keys `pomodoro_work_mins` and `pomodoro_break_mins` and restore them on Dashboard load.

### Requirement 6: To-Do List — Task Management

**User Story:** As a user, I want to add, complete, and delete tasks, so that I can track what I need to do.

#### Acceptance Criteria

1. WHEN a user types a task description and presses Enter or clicks the Add button, THE Todo_List SHALL create a new task with a unique ID, the given description, and a completion state of false, and add it to the list.
2. IF a user attempts to add a task with an empty or whitespace-only description, THEN THE Todo_List SHALL reject the addition and preserve the current task list without modification.
3. WHEN a user clicks the checkbox on a task, THE Todo_List SHALL toggle that task's completion state.
4. WHEN a user clicks the delete button on a task, THE Todo_List SHALL remove that task from the list permanently.
5. THE Todo_List SHALL display the count of incomplete tasks and total tasks in the format "X remaining / Y total".
6. WHEN a task is added, completed, or deleted, THE Todo_List SHALL persist the updated task list to LocalStorage under the key `dashboard_todos` immediately.
7. WHEN the Dashboard loads, THE Todo_List SHALL restore all tasks from LocalStorage and display them in the order they were saved.

### Requirement 7: To-Do List — Filtering

**User Story:** As a user, I want to filter tasks by status, so that I can focus on what still needs to be done or review completed items.

#### Acceptance Criteria

1. THE Todo_List SHALL provide filter controls for "All", "Active", and "Completed" views.
2. WHEN a user selects the "All" filter, THE Todo_List SHALL display every task regardless of completion state.
3. WHEN a user selects the "Active" filter, THE Todo_List SHALL display only tasks whose completion state is false.
4. WHEN a user selects the "Completed" filter, THE Todo_List SHALL display only tasks whose completion state is true.
5. WHEN the active filter changes, THE Todo_List SHALL update the displayed task list immediately without affecting the stored task data.

### Requirement 8: Quick Links — Link Management

**User Story:** As a user, I want to add and remove personalised bookmark tiles, so that I can access my most-used sites quickly from the dashboard.

#### Acceptance Criteria

1. WHEN a user fills in a title and a URL and clicks the Add Link button, THE Quick_Links SHALL create a new Link_Tile with the provided title, URL, and optional emoji icon and add it to the grid.
2. IF a user attempts to add a link with an empty title or an empty URL, THEN THE Quick_Links SHALL reject the addition and leave the link grid unmodified.
3. WHEN a user clicks a Link_Tile, THE Quick_Links SHALL open the tile's URL in a new browser tab.
4. WHEN a user clicks the remove button on a Link_Tile, THE Quick_Links SHALL remove that tile from the grid permanently.
5. WHEN a link is added or removed, THE Quick_Links SHALL persist the updated link list to LocalStorage under the key `dashboard_links` immediately.
6. WHEN the Dashboard loads, THE Quick_Links SHALL restore all saved Link_Tiles from LocalStorage and display them in the grid.

### Requirement 9: General — Responsive Layout

**User Story:** As a user, I want the dashboard to be usable on both desktop and mobile screens, so that I can access it from any device.

#### Acceptance Criteria

1. THE Dashboard SHALL use a CSS Grid or Flexbox layout that displays all four widgets in a two-column grid on viewports wider than 768 px.
2. WHEN the viewport width is 768 px or narrower, THE Dashboard SHALL reflow to a single-column layout where widgets stack vertically.
3. THE Dashboard SHALL use relative font sizes and fluid spacing so that text and controls remain legible and tappable on screens as narrow as 320 px.

### Requirement 10: General — Theming

**User Story:** As a user, I want a clean, modern dark-themed interface, so that the dashboard is visually comfortable and easy to use.

#### Acceptance Criteria

1. THE Dashboard SHALL apply a dark colour palette as the default theme using CSS custom properties (variables) for all colours.
2. THE Dashboard SHALL use a readable sans-serif typeface for all text.
3. THE Dashboard SHALL provide sufficient colour contrast between text and background to meet WCAG AA guidelines (minimum 4.5:1 contrast ratio for normal text).
