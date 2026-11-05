/* =====================================================================
   Life Dashboard — script.js
   Modules: Storage | Theme | Greeting | Timer | Todo | Links | App
   ===================================================================== */

'use strict';

/* ── Storage ─────────────────────────────────────────────────────────── */
const Storage = {
  get(key, defaultVal) {
    try {
      const raw = localStorage.getItem(key);
      if (raw === null) return defaultVal;
      return JSON.parse(raw);
    } catch (e) {
      console.warn('[Storage] Failed to read key:', key, e);
      return defaultVal;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.warn('[Storage] Failed to write key:', key, e);
    }
  }
};

/* ── Theme ───────────────────────────────────────────────────────────── */
const Theme = {
  _current: 'dark',

  init() {
    // Restore saved preference; fall back to 'dark'
    this._current = Storage.get('dashboard_theme', 'dark');
    this._apply();

    document.getElementById('theme-toggle')
      .addEventListener('click', () => this.toggle());
  },

  toggle() {
    this._current = this._current === 'dark' ? 'light' : 'dark';
    this._apply();
    Storage.set('dashboard_theme', this._current);
  },

  _apply() {
    document.documentElement.setAttribute('data-theme', this._current);
  }
};

/* ── Greeting / Clock ────────────────────────────────────────────────── */
const Greeting = {
  _intervalId: null,
  _name: 'World',

  init() {
    this._name = Storage.get('dashboard_username', 'World');
    this._renderName();
    this.tick();
    this._intervalId = setInterval(() => this.tick(), 1000);

    document.getElementById('greeting-name')
      .addEventListener('click', () => this.startEdit());
  },

  tick() {
    const now = new Date();
    const h = now.getHours();

    let period;
    if (h >= 5 && h <= 11)       period = 'morning';
    else if (h >= 12 && h <= 17) period = 'afternoon';
    else                          period = 'evening';
    document.getElementById('greeting-text').textContent = `Good ${period}, `;

    const dateStr = now.toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
    document.getElementById('greeting-date').textContent = dateStr;

    const hh = String(h).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    const ss = String(now.getSeconds()).padStart(2, '0');
    document.getElementById('greeting-time').textContent = `${hh}:${mm}:${ss}`;
  },

  _renderName() {
    document.getElementById('greeting-name').textContent = this._name;
  },

  startEdit() {
    const nameEl = document.getElementById('greeting-name');
    if (nameEl.querySelector('input')) return;

    const currentName = this._name;
    nameEl.textContent = '';

    const input = document.createElement('input');
    input.type      = 'text';
    input.value     = currentName;
    input.className = 'name-input';
    input.setAttribute('aria-label', 'Your name');
    nameEl.appendChild(input);
    input.select();

    const commit = () => this.commitEdit(input.value);
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter')  { e.preventDefault(); commit(); }
      if (e.key === 'Escape') { this._name = currentName; this._renderName(); }
    });
    input.addEventListener('blur', commit);
  },

  commitEdit(value) {
    const trimmed = (value || '').trim();
    if (trimmed.length > 0) {
      this._name = trimmed;
      Storage.set('dashboard_username', this._name);
    }
    this._renderName();
  }
};

/* ── Focus Timer ─────────────────────────────────────────────────────── */
const Timer = {
  state: {
    mode:       'work',
    remaining:  25 * 60,
    running:    false,
    workMins:   25,
    breakMins:  5,
    intervalId: null
  },
  _pendingWork:  null,
  _pendingBreak: null,

  init() {
    this.state.workMins  = Storage.get('pomodoro_work_mins', 25);
    this.state.breakMins = Storage.get('pomodoro_break_mins', 5);
    this.state.remaining = this.state.workMins * 60;

    document.getElementById('cfg-work').value  = this.state.workMins;
    document.getElementById('cfg-break').value = this.state.breakMins;

    this.render();
    this._bindEvents();
  },

  _bindEvents() {
    document.getElementById('timer-start').addEventListener('click', () => this.start());
    document.getElementById('timer-pause').addEventListener('click', () => this.pause());
    document.getElementById('timer-reset').addEventListener('click', () => this.reset());

    document.getElementById('cfg-work').addEventListener('change', (e) => {
      let val = parseInt(e.target.value, 10);
      if (isNaN(val) || val < 1) val = 1;
      if (val > 60)              val = 60;
      e.target.value = val;
      if (this.state.running) {
        this._pendingWork = val;
      } else {
        this.state.workMins = val;
        if (this.state.mode === 'work') this.state.remaining = val * 60;
        this.render();
      }
      Storage.set('pomodoro_work_mins', val);
    });

    document.getElementById('cfg-break').addEventListener('change', (e) => {
      let val = parseInt(e.target.value, 10);
      if (isNaN(val) || val < 1) val = 1;
      if (val > 30)              val = 30;
      e.target.value = val;
      if (this.state.running) {
        this._pendingBreak = val;
      } else {
        this.state.breakMins = val;
        if (this.state.mode === 'break') this.state.remaining = val * 60;
        this.render();
      }
      Storage.set('pomodoro_break_mins', val);
    });
  },

  start() {
    if (this.state.running) return;
    this.state.running = true;
    this.state.intervalId = setInterval(() => this.tick(), 1000);
    this.render();
  },

  pause() {
    if (!this.state.running) return;
    clearInterval(this.state.intervalId);
    this.state.intervalId = null;
    this.state.running = false;
    this.render();
  },

  reset() {
    clearInterval(this.state.intervalId);
    this.state.intervalId = null;
    this.state.running = false;
    this.state.remaining = (this.state.mode === 'work')
      ? this.state.workMins * 60
      : this.state.breakMins * 60;
    this.render();
  },

  tick() {
    if (this.state.remaining > 0) {
      this.state.remaining--;
      this.render();
    } else {
      this.onSessionEnd();
    }
  },

  onSessionEnd() {
    clearInterval(this.state.intervalId);
    this.state.intervalId = null;
    this.state.running = false;

    this.playBeep();

    if (this._pendingWork  !== null) { this.state.workMins  = this._pendingWork;  this._pendingWork  = null; }
    if (this._pendingBreak !== null) { this.state.breakMins = this._pendingBreak; this._pendingBreak = null; }

    this.state.mode = (this.state.mode === 'work') ? 'break' : 'work';
    this.state.remaining = (this.state.mode === 'work')
      ? this.state.workMins * 60
      : this.state.breakMins * 60;

    this.render();
    this.start();
  },

  playBeep() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) throw new Error('No AudioContext');
      const ctx  = new AudioCtx();
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(660, ctx.currentTime);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.5);
      osc.onended = () => ctx.close();
    } catch (e) {
      const display = document.getElementById('timer-display');
      display.classList.remove('flash');
      void display.offsetWidth;
      display.classList.add('flash');
      display.addEventListener('animationend', () => display.classList.remove('flash'), { once: true });
    }
  },

  render() {
    const { mode, remaining, running } = this.state;
    const modeEl = document.getElementById('timer-mode');
    modeEl.textContent = mode === 'work' ? 'Work' : 'Break';
    modeEl.className   = 'timer-mode' + (mode === 'break' ? ' break' : '');

    const mins = String(Math.floor(remaining / 60)).padStart(2, '0');
    const secs = String(remaining % 60).padStart(2, '0');
    document.getElementById('timer-display').textContent = `${mins}:${secs}`;

    document.getElementById('timer-start').disabled = running;
    document.getElementById('timer-pause').disabled = !running;
  }
};

/* ── To-Do List ─────────────────────────────────────────────────────── */
const Todo = {
  tasks:  [],
  filter: 'all',

  init() {
    this.tasks = Storage.get('dashboard_todos', []);
    this.render();
    this._bindEvents();
  },

  _bindEvents() {
    const addBtn = document.getElementById('todo-add-btn');
    const input  = document.getElementById('todo-input');

    addBtn.addEventListener('click', () => { this.add(input.value); input.value = ''; input.focus(); });
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); this.add(input.value); input.value = ''; }
    });

    document.querySelectorAll('.filter-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        this.filter = btn.dataset.filter;
        document.querySelectorAll('.filter-btn').forEach((b) =>
          b.classList.toggle('active', b.dataset.filter === this.filter)
        );
        this.render();
      });
    });
  },

  add(description) {
    const trimmed = (description || '').trim();
    if (!trimmed) return;
    this.tasks.push({
      id:          `${Date.now()}_${Math.random().toString(36).slice(2)}`,
      description: trimmed,
      completed:   false
    });
    this.save();
    this.render();
  },

  toggle(id) {
    const task = this.tasks.find((t) => t.id === id);
    if (!task) return;
    task.completed = !task.completed;
    this.save();
    this.render();
  },

  remove(id) {
    this.tasks = this.tasks.filter((t) => t.id !== id);
    this.save();
    this.render();
  },

  save() {
    Storage.set('dashboard_todos', this.tasks);
  },

  render() {
    const list = document.getElementById('todo-list');
    list.innerHTML = '';

    const visible = this.tasks.filter((t) => {
      if (this.filter === 'active')    return !t.completed;
      if (this.filter === 'completed') return  t.completed;
      return true;
    });

    visible.forEach((task) => {
      const li = document.createElement('li');
      li.className = 'todo-item' + (task.completed ? ' completed' : '');

      const cb = document.createElement('input');
      cb.type      = 'checkbox';
      cb.checked   = task.completed;
      cb.className = 'todo-checkbox';
      cb.setAttribute('aria-label', `Mark "${task.description}" as ${task.completed ? 'incomplete' : 'complete'}`);
      cb.addEventListener('change', () => this.toggle(task.id));

      const label = document.createElement('span');
      label.className   = 'todo-label';
      label.textContent = task.description;

      const delBtn = document.createElement('button');
      delBtn.className   = 'btn btn--danger';
      delBtn.textContent = '✕';
      delBtn.setAttribute('aria-label', `Delete "${task.description}"`);
      delBtn.addEventListener('click', () => this.remove(task.id));

      li.append(cb, label, delBtn);
      list.appendChild(li);
    });

    const remaining = this.tasks.filter((t) => !t.completed).length;
    document.getElementById('todo-count').textContent =
      `${remaining} remaining / ${this.tasks.length} total`;
  }
};

/* ── Quick Links ─────────────────────────────────────────────────────── */
const Links = {
  links: [],

  init() {
    this.links = Storage.get('dashboard_links', []);
    this.render();
    this._bindEvents();
  },

  _bindEvents() {
    document.getElementById('link-add-btn').addEventListener('click', () => {
      const emoji = document.getElementById('link-emoji').value.trim();
      const title = document.getElementById('link-title').value;
      const url   = document.getElementById('link-url').value;
      if (this.add(title, url, emoji)) {
        document.getElementById('link-emoji').value = '';
        document.getElementById('link-title').value = '';
        document.getElementById('link-url').value   = '';
      }
    });

    document.getElementById('link-url').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); document.getElementById('link-add-btn').click(); }
    });
  },

  add(title, url, emoji) {
    const tTitle = (title || '').trim();
    const tUrl   = (url   || '').trim();
    if (!tTitle || !tUrl) return false;

    let safeUrl = tUrl;
    if (!/^https?:\/\//i.test(safeUrl)) safeUrl = 'https://' + safeUrl;

    this.links.push({
      id:    `${Date.now()}_${Math.random().toString(36).slice(2)}`,
      title: tTitle,
      url:   safeUrl,
      emoji: emoji || ''
    });
    this.save();
    this.render();
    return true;
  },

  remove(id) {
    this.links = this.links.filter((l) => l.id !== id);
    this.save();
    this.render();
  },

  save() {
    Storage.set('dashboard_links', this.links);
  },

  render() {
    const grid = document.getElementById('links-grid');
    grid.innerHTML = '';

    this.links.forEach((link) => {
      const a = document.createElement('a');
      a.href      = link.url;
      a.target    = '_blank';
      a.rel       = 'noopener noreferrer';
      a.className = 'link-tile';
      a.setAttribute('aria-label', link.title);

      const emojiSpan = document.createElement('span');
      emojiSpan.className   = 'link-emoji';
      emojiSpan.textContent = link.emoji || '🔗';
      emojiSpan.setAttribute('aria-hidden', 'true');
      a.appendChild(emojiSpan);

      const text = document.createElement('span');
      text.className   = 'link-text';
      text.textContent = link.title;
      a.appendChild(text);

      const removeBtn = document.createElement('button');
      removeBtn.className   = 'link-remove';
      removeBtn.textContent = '✕';
      removeBtn.setAttribute('aria-label', `Remove ${link.title}`);
      removeBtn.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); this.remove(link.id); });
      a.appendChild(removeBtn);

      grid.appendChild(a);
    });
  }
};

/* ── App Bootstrap ───────────────────────────────────────────────────── */
const App = {
  init() {
    Theme.init();    // apply theme before anything renders
    Greeting.init();
    Timer.init();
    Todo.init();
    Links.init();
  }
};

// Expose for console-based testing
window.Storage  = Storage;
window.Theme    = Theme;
window.Greeting = Greeting;
window.Timer    = Timer;
window.Todo     = Todo;
window.Links    = Links;

document.addEventListener('DOMContentLoaded', () => App.init());
