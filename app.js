/* Small Steps — a thinking scaffold for making big things small.
   No backend, no accounts. Everything lives in localStorage. */

(function () {
  'use strict';

  var STORAGE_KEY = 'small-steps-v1';

  /* ---------- i18n ---------- */

  var STRINGS = {
    sv: {
      tagline: 'Stora mål blir små steg.',
      askGoal: 'Vad vill du uppnå?',
      goalPlaceholder: 'Skriv ett mål …',
      addGoal: 'Lägg till mål',
      emptyTitle: 'Börja med ett mål',
      emptyText: 'Skriv något du vill uppnå. Sedan bryter du ner det i små steg – ett i taget, i din egen takt.',
      footer: 'All data sparas bara på din enhet. Fungerar offline.',
      done: 'Klart',
      undo: 'Ångra klart',
      tooBig: 'För stort',
      addStep: 'Lägg till steg',
      rename: 'Byt namn',
      remove: 'Ta bort',
      stepPlaceholder: 'Ett litet steg …',
      splitHint: 'Fyll i några mindre steg. Lämna tomt det du inte behöver.',
      progress: function (d, t) { return d + '/' + t + ' steg klara'; },
      next: 'nästa',
      goalDone: 'Du nådde ditt mål 🌿',
      flowHint: 'Tryck på ett steg för att bocka av det, dela upp det eller ta bort det.',
      guide1: 'Skriv in något du vill uppnå.',
      guide2: 'Känns det för stort? Tryck på steget och välj ”För stort” för att dela upp det i mindre steg.',
      guide3: 'Bocka av de små stegen i din takt – när alla är klara är målet nått.',
      resetAll: 'Rensa allt och börja om',
      confirmReset: 'Ta bort alla mål och börja om från början?',
      confirmRemove: 'Ta bort det här steget och alla dess understeg?',
      expand: 'Visa understeg',
      collapse: 'Dölj understeg',
      markDone: 'Markera som klart',
      langLabel: 'Switch to English'
    },
    en: {
      tagline: 'Big goals become small steps.',
      askGoal: 'What do you want to achieve?',
      goalPlaceholder: 'Write a goal …',
      addGoal: 'Add goal',
      emptyTitle: 'Start with a goal',
      emptyText: 'Write something you want to achieve. Then break it into small steps – one at a time, at your own pace.',
      footer: 'All data stays on your device. Works offline.',
      done: 'Done',
      undo: 'Undo done',
      tooBig: 'Too big',
      addStep: 'Add step',
      rename: 'Rename',
      remove: 'Remove',
      stepPlaceholder: 'One small step …',
      splitHint: 'Fill in a few smaller steps. Leave blank what you don’t need.',
      progress: function (d, t) { return d + '/' + t + ' steps done'; },
      next: 'next',
      goalDone: 'You reached your goal 🌿',
      flowHint: 'Tap a step to check it off, split it up, or remove it.',
      guide1: 'Write down something you want to achieve.',
      guide2: 'Feels too big? Tap the step and choose “Too big” to split it into smaller steps.',
      guide3: 'Check off the small steps at your own pace – when they are all done, the goal is reached.',
      resetAll: 'Clear everything and start over',
      confirmReset: 'Remove all goals and start from scratch?',
      confirmRemove: 'Remove this step and all of its sub-steps?',
      expand: 'Show sub-steps',
      collapse: 'Hide sub-steps',
      markDone: 'Mark as done',
      langLabel: 'Byt till svenska'
    }
  };

  function t(key) {
    return STRINGS[state.lang][key];
  }

  /* ---------- state ---------- */

  var state = load();
  var selectedId = null;   // node with open action bar
  var renamingId = null;   // node being renamed
  var hintId = null;       // node showing the "too big" hint
  var pendingFocusId = null;

  function defaultState() {
    var lang = (navigator.language || 'en').toLowerCase().indexOf('sv') === 0 ? 'sv' : 'en';
    return { lang: lang, goals: [] };
  }

  function load() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return defaultState();
      var data = JSON.parse(raw);
      if (!data || !Array.isArray(data.goals)) return defaultState();
      if (data.lang !== 'sv' && data.lang !== 'en') data.lang = defaultState().lang;
      pruneBlanks(data.goals);
      for (var i = 0; i < data.goals.length; i++) recomputeDone(data.goals[i]);
      return data;
    } catch (e) {
      return defaultState();
    }
  }

  function save() {
    for (var i = 0; i < state.goals.length; i++) recomputeDone(state.goals[i]);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) { /* storage full or blocked — app keeps working in memory */ }
  }

  /* A step with sub-steps is done exactly when all of them are. */
  function recomputeDone(node) {
    if (node.children.length === 0) return node.done;
    var all = true;
    for (var i = 0; i < node.children.length; i++) {
      if (!recomputeDone(node.children[i])) all = false;
    }
    node.done = all;
    return node.done;
  }

  /* First unfinished leaf step — the next small thing to do. */
  function nextStepId(node) {
    if (node.title === '') return null;
    if (node.children.length === 0) return node.done ? null : node.id;
    for (var i = 0; i < node.children.length; i++) {
      var hit = nextStepId(node.children[i]);
      if (hit) return hit;
    }
    return null;
  }

  /* Blank steps are drafts; drop any that were never filled in. */
  function pruneBlanks(nodes) {
    for (var i = nodes.length - 1; i >= 0; i--) {
      if (typeof nodes[i].title !== 'string' || nodes[i].title === '') nodes.splice(i, 1);
      else pruneBlanks(nodes[i].children);
    }
  }

  function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  function makeNode(title) {
    return { id: uid(), title: title, done: false, open: true, children: [] };
  }

  /* ---------- tree helpers ---------- */

  function findNode(id, nodes, parentList) {
    nodes = nodes || state.goals;
    parentList = parentList || state.goals;
    for (var i = 0; i < nodes.length; i++) {
      if (nodes[i].id === id) return { node: nodes[i], list: nodes, index: i };
      var hit = findNode(id, nodes[i].children, nodes[i].children);
      if (hit) return hit;
    }
    return null;
  }

  function countSteps(node) {
    var total = 0, done = 0;
    (function walk(children) {
      for (var i = 0; i < children.length; i++) {
        total++;
        if (children[i].done) done++;
        walk(children[i].children);
      }
    })(node.children);
    return { done: done, total: total };
  }

  /* ---------- rendering ---------- */

  var goalsEl = document.getElementById('goals');
  var emptyEl = document.getElementById('empty-state');
  var formEl = document.getElementById('goal-form');
  var inputEl = document.getElementById('goal-input');
  var langBtn = document.getElementById('lang-toggle');
  var flowHintEl = document.getElementById('flow-hint');
  var resetRowEl = document.getElementById('reset-row');
  var resetBtn = document.getElementById('reset-all');

  function esc(s) {
    return s.replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function checkSvg() {
    return '<svg viewBox="0 0 16 16" fill="none" aria-hidden="true">' +
      '<path d="M3 8.5 6.5 12 13 4.5" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  }

  function chevronSvg() {
    return '<svg viewBox="0 0 12 12" fill="none" aria-hidden="true">' +
      '<path d="M4 2l4 4-4 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  }

  function renderNode(node) {
    var isBlank = node.title === '' && renamingId !== node.id;
    var isRenaming = renamingId === node.id;
    var hasKids = node.children.length > 0;
    var cls = 'node' + (node.done ? ' is-done' : '') + (node.open && hasKids ? ' is-open' : '');
    var html = '<li class="' + cls + '" data-id="' + node.id + '">';

    if (isBlank || isRenaming) {
      html += '<div class="step-input-row">' +
        '<span class="twist-spacer"></span>' +
        '<input class="step-input" data-id="' + node.id + '" type="text" maxlength="200" ' +
        'value="' + esc(node.title) + '" placeholder="' + esc(t('stepPlaceholder')) + '" autocomplete="off">' +
        '</div>';
    } else {
      html += '<div class="node-row' + (selectedId === node.id ? ' selected' : '') + '">';
      if (hasKids) {
        html += '<button class="twist" data-action="toggle" data-id="' + node.id + '" ' +
          'aria-expanded="' + (node.open ? 'true' : 'false') + '" ' +
          'aria-label="' + esc(node.open ? t('collapse') : t('expand')) + '">' + chevronSvg() + '</button>';
      } else {
        html += '<span class="twist-spacer"></span>';
      }
      html += '<button class="check" data-action="check" data-id="' + node.id + '" ' +
        'aria-pressed="' + (node.done ? 'true' : 'false') + '" aria-label="' + esc(t('markDone')) + '">' +
        checkSvg() + '</button>';
      html += '<button class="node-title" data-action="select" data-id="' + node.id + '">' +
        esc(node.title) + '</button>';
      if (currentNextId === node.id) {
        html += '<span class="next-chip">' + esc(t('next')) + '</span>';
      }
      if (hasKids) {
        var p = countSteps(node);
        html += '<span class="node-progress">' + esc(t('progress')(p.done, p.total)) + '</span>';
      }
      html += '</div>';

      if (selectedId === node.id) {
        html += '<div class="actions">' +
          '<button class="action-btn too-big" data-action="too-big" data-id="' + node.id + '">' + esc(t('tooBig')) + '</button>' +
          '<button class="action-btn" data-action="check" data-id="' + node.id + '">' + esc(node.done ? t('undo') : t('done')) + '</button>' +
          '<button class="action-btn" data-action="add-step" data-id="' + node.id + '">' + esc(t('addStep')) + '</button>' +
          '<button class="action-btn" data-action="rename" data-id="' + node.id + '">' + esc(t('rename')) + '</button>' +
          '<button class="action-btn danger" data-action="remove" data-id="' + node.id + '">' + esc(t('remove')) + '</button>' +
          '</div>';
      }
      if (hintId === node.id) {
        html += '<p class="split-hint">' + esc(t('splitHint')) + '</p>';
      }
    }

    if (hasKids) {
      html += '<ul>';
      for (var i = 0; i < node.children.length; i++) html += renderNode(node.children[i]);
      html += '</ul>';
    }
    html += '</li>';
    return html;
  }

  var currentNextId = null;

  function renderGoalCard(goal) {
    var p = countSteps(goal);
    var pct = p.total > 0 ? Math.round((p.done / p.total) * 100) : (goal.done ? 100 : 0);
    var complete = goal.done && goal.title !== '';
    currentNextId = nextStepId(goal);

    var html = '<article class="goal-card' + (complete ? ' is-complete' : '') + '">';
    if (p.total > 0) {
      html += '<div class="bar" aria-hidden="true"><div class="bar-fill" style="width:' + pct + '%"></div></div>';
    }
    if (complete) {
      html += '<p class="complete-note">' + esc(t('goalDone')) + '</p>';
    }
    html += '<ul class="tree">' + renderNode(goal) + '</ul></article>';
    return html;
  }

  function render() {
    var html = '';
    for (var i = 0; i < state.goals.length; i++) {
      html += renderGoalCard(state.goals[i]);
    }
    goalsEl.innerHTML = html;
    emptyEl.hidden = state.goals.length > 0;
    flowHintEl.hidden = state.goals.length === 0;
    resetRowEl.hidden = state.goals.length === 0;

    applyStaticStrings();

    if (pendingFocusId) {
      var el = goalsEl.querySelector('.step-input[data-id="' + pendingFocusId + '"]');
      pendingFocusId = null;
      if (el) {
        el.focus();
        el.setSelectionRange(el.value.length, el.value.length);
      }
    }
  }

  function applyStaticStrings() {
    document.documentElement.lang = state.lang;
    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      el.textContent = t(el.getAttribute('data-i18n'));
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(function (el) {
      el.placeholder = t(el.getAttribute('data-i18n-placeholder'));
    });
    langBtn.textContent = state.lang === 'sv' ? 'EN' : 'SV';
    langBtn.setAttribute('aria-label', t('langLabel'));
  }

  /* ---------- actions ---------- */

  function addGoal(title) {
    state.goals.push(makeNode(title));
    save();
    render();
  }

  function toggleOpen(id) {
    var hit = findNode(id);
    if (!hit) return;
    hit.node.open = !hit.node.open;
    save();
    render();
  }

  function selectNode(id) {
    selectedId = selectedId === id ? null : id;
    if (hintId && hintId !== id) hintId = null;
    render();
  }

  function toggleDone(id) {
    var hit = findNode(id);
    if (!hit) return;
    var value = !hit.node.done;
    (function setAll(node) {
      node.done = value;
      for (var i = 0; i < node.children.length; i++) setAll(node.children[i]);
    })(hit.node);
    if (selectedId === id) selectedId = null;
    save();
    render();
  }

  function tooBig(id) {
    var hit = findNode(id);
    if (!hit) return;
    var first = null;
    for (var i = 0; i < 3; i++) {
      var child = makeNode('');
      if (!first) first = child.id;
      hit.node.children.push(child);
    }
    hit.node.open = true;
    hintId = id;
    selectedId = null;
    pendingFocusId = first;
    render(); // blank nodes are not persisted until titled
  }

  function addStep(id) {
    var hit = findNode(id);
    if (!hit) return;
    var child = makeNode('');
    hit.node.children.push(child);
    hit.node.open = true;
    selectedId = null;
    pendingFocusId = child.id;
    render();
  }

  function startRename(id) {
    renamingId = id;
    selectedId = null;
    pendingFocusId = id;
    render();
  }

  function removeNode(id, skipConfirm) {
    var hit = findNode(id);
    if (!hit) return;
    if (!skipConfirm && (hit.node.children.length > 0)) {
      if (!window.confirm(t('confirmRemove'))) return;
    }
    hit.list.splice(hit.index, 1);
    if (selectedId === id) selectedId = null;
    if (hintId === id) hintId = null;
    save();
    render();
  }

  /* Commit an inline input: set the title, or drop the node if left empty. */
  function commitInput(input, focusNextBlank) {
    var id = input.getAttribute('data-id');
    var hit = findNode(id);
    if (!hit) return;
    var value = input.value.trim();

    if (renamingId === id) {
      if (value) hit.node.title = value;
      renamingId = null;
      save();
      render();
      return;
    }

    if (value) {
      hit.node.title = value;
    } else {
      hit.list.splice(hit.index, 1);
      if (hintId && !findBlank(hintId)) hintId = null;
    }

    if (focusNextBlank) {
      var blank = firstBlankId(state.goals);
      if (blank) pendingFocusId = blank;
      else hintId = null;
    } else if (!firstBlankId(state.goals)) {
      hintId = null;
    }
    save();
    render();
  }

  function firstBlankId(nodes) {
    for (var i = 0; i < nodes.length; i++) {
      if (nodes[i].title === '' && nodes[i].id !== renamingId) return nodes[i].id;
      var hit = firstBlankId(nodes[i].children);
      if (hit) return hit;
    }
    return null;
  }

  function findBlank(parentId) {
    var hit = findNode(parentId);
    if (!hit) return false;
    for (var i = 0; i < hit.node.children.length; i++) {
      if (hit.node.children[i].title === '') return true;
    }
    return false;
  }

  /* ---------- events ---------- */

  formEl.addEventListener('submit', function (e) {
    e.preventDefault();
    var title = inputEl.value.trim();
    if (!title) return;
    inputEl.value = '';
    addGoal(title);
  });

  goalsEl.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-action]');
    if (!btn) return;
    var id = btn.getAttribute('data-id');
    switch (btn.getAttribute('data-action')) {
      case 'toggle': toggleOpen(id); break;
      case 'select': selectNode(id); break;
      case 'check': toggleDone(id); break;
      case 'too-big': tooBig(id); break;
      case 'add-step': addStep(id); break;
      case 'rename': startRename(id); break;
      case 'remove': removeNode(id); break;
    }
  });

  goalsEl.addEventListener('keydown', function (e) {
    if (e.key !== 'Enter' && e.key !== 'Escape') return;
    var input = e.target.closest('.step-input');
    if (!input) return;
    e.preventDefault();
    if (e.key === 'Escape') input.value = input.defaultValue = '';
    commitInput(input, e.key === 'Enter');
  });

  goalsEl.addEventListener('focusout', function (e) {
    var input = e.target.closest && e.target.closest('.step-input');
    if (!input || !document.contains(input)) return;
    // Keep focus if the user tapped straight into another step input
    var next = e.relatedTarget && e.relatedTarget.closest && e.relatedTarget.closest('.step-input');
    if (next) pendingFocusId = next.getAttribute('data-id');
    commitInput(input, false);
  });

  langBtn.addEventListener('click', function () {
    state.lang = state.lang === 'sv' ? 'en' : 'sv';
    save();
    render();
  });

  resetBtn.addEventListener('click', function () {
    if (!window.confirm(t('confirmReset'))) return;
    var lang = state.lang;
    state = defaultState();
    state.lang = lang;
    selectedId = renamingId = hintId = null;
    save();
    render();
  });

  /* ---------- boot ---------- */

  render();

  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('sw.js').catch(function () { /* offline still works via cache on next visit */ });
    });
  }
})();
