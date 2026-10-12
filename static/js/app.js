/* ==========================================================================
   RANKION - SSC CHSL 2027 AIR 1 Client Engine
   ========================================================================== */

let currentView = 'dashboard';
let currentTheme = 'light';
let subjectsCache = [];
let chaptersCache = [];

// Flashcard Revision State
let studyQueue = [];
let currentStudyIndex = 0;
let studySessionStats = { total: 0, correct: 0, lapses: 0 };
let cardStartTime = 0;

// Exam Simulator State
let currentExamAttempt = null;
let currentExamQuestions = [];
let currentExamQuestionIndex = 0;
let examTimerInterval = null;
let examTimeElapsedSeconds = 0;

// Draft Flashcards State
let draftCardsCache = [];

// ==========================================================================
// Initialization & Authentication (Passcode: 2486)
// Always requires passcode on initial visit and page refresh
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  showLockScreen();
});

function initTheme() {
  const savedTheme = localStorage.getItem('rankion_theme') || 'light';
  setAppTheme(savedTheme, false);
}

function setAppTheme(theme, save = true) {
  currentTheme = theme;
  document.documentElement.setAttribute('data-theme', theme);
  const btn = document.getElementById('theme-toggle-btn');
  if (btn) btn.textContent = theme === 'dark' ? 'Light Mode' : 'Dark Mode';
  if (save) {
    localStorage.setItem('rankion_theme', theme);
    // Persist to server
    fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ theme })
    }).catch(() => {});
  }
}

function toggleTheme() {
  setAppTheme(currentTheme === 'dark' ? 'light' : 'dark');
}

function checkAuthStatus() {
  showLockScreen();
}

function showLockScreen() {
  document.getElementById('lock-screen').style.display = 'flex';
  document.getElementById('main-app').style.display = 'none';
  const pinInput = document.getElementById('passcode-input');
  if (pinInput) {
    pinInput.value = '';
    pinInput.focus();
  }
}

function showAppShell() {
  document.getElementById('lock-screen').style.display = 'none';
  document.getElementById('main-app').style.display = 'flex';
  loadInitialData();
  navigateTo('dashboard');
}

async function handleUnlockSubmit(event) {
  event.preventDefault();
  const input = document.getElementById('passcode-input');
  const errorEl = document.getElementById('lock-error-msg');
  const passcode = input.value.trim();
  errorEl.textContent = '';

  try {
    const res = await fetch('/api/auth/unlock', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ passcode })
    });
    if (!res.ok) {
      const err = await res.json();
      errorEl.textContent = err.detail || 'Access denied. Incorrect passcode.';
      input.value = '';
      input.focus();
      return;
    }
    showAppShell();
  } catch (err) {
    errorEl.textContent = 'Connection error. Please try again.';
  }
}

async function lockWebsite() {
  try {
    await fetch('/api/auth/lock', { method: 'POST' });
  } catch (e) {}
  showLockScreen();
  showToast('Website locked.', 'info');
}

// ==========================================================================
// Navigation & Router
// ==========================================================================
function navigateTo(viewName) {
  currentView = viewName;
  document.querySelectorAll('.app-view').forEach(el => el.style.display = 'none');
  const target = document.getElementById(`view-${viewName}`);
  if (target) target.style.display = 'block';

  document.querySelectorAll('.nav-item').forEach(el => {
    el.classList.toggle('active', el.dataset.view === viewName);
  });

  const titles = {
    dashboard: 'Dashboard & Study Roadmap',
    subjects: 'My Subjects',
    chapters: 'Chapter Library',
    notes: 'My Notes & Source Documents',
    flashcards: 'Active Recall Flashcards',
    tests: 'Examination & Practice Testing',
    mistakes: 'Mistake Notebook & Error Diagnostics',
    revision: 'Spaced Repetition Schedule',
    pyqs: 'Authentic Previous Year Questions',
    analytics: 'Performance Analytics',
    settings: 'Settings & Security'
  };

  document.getElementById('topbar-title').textContent = titles[viewName] || 'Rankion';
  document.getElementById('topbar-breadcrumb').textContent = `Rankion > ${titles[viewName] || viewName}`;

  // Close mobile drawer if open
  document.getElementById('app-sidebar').classList.remove('mobile-open');

  // Trigger view refresh
  if (viewName === 'dashboard') loadDashboard();
  else if (viewName === 'subjects') loadSubjectsList();
  else if (viewName === 'chapters') loadChaptersList();
  else if (viewName === 'notes') loadNotesList();
  else if (viewName === 'flashcards') loadFlashcardsList();
  else if (viewName === 'tests') {
    loadTestsHistory();
    loadPracticeQuestionsList();
  }
  else if (viewName === 'mistakes') loadMistakesList();
  else if (viewName === 'revision') loadRevisionSchedule();
  else if (viewName === 'pyqs') loadPYQsList();
  else if (viewName === 'analytics') loadAnalyticsView();
  else if (viewName === 'settings') loadSettingsView();
}

function toggleMobileSidebar() {
  document.getElementById('app-sidebar').classList.toggle('mobile-open');
}

async function loadInitialData() {
  await fetchSubjectsCache();
  await refreshGlobalBadges();
}

async function fetchSubjectsCache() {
  try {
    const res = await fetch('/api/subjects');
    subjectsCache = await res.json();
    document.getElementById('badge-subject-count').textContent = subjectsCache.length;
  } catch (e) {
    subjectsCache = [];
  }
}

async function refreshGlobalBadges() {
  try {
    const [dueRes, mistakeRes] = await Promise.all([
      fetch('/api/flashcards/due-summary'),
      fetch('/api/mistakes/stats')
    ]);
    const dueData = await dueRes.json();
    const mistakeData = await mistakeRes.json();

    const dueBadge = document.getElementById('badge-due-flashcards');
    if (dueData.total_due > 0) {
      dueBadge.textContent = `${dueData.total_due} Due`;
      dueBadge.style.display = 'inline-block';
    } else {
      dueBadge.style.display = 'none';
    }

    const mistakeBadge = document.getElementById('badge-mistake-count');
    mistakeBadge.textContent = mistakeData.unresolved_count;
  } catch (e) {}
}

// ==========================================================================
// VIEW: DASHBOARD
// ==========================================================================
async function loadDashboard() {
  try {
    const [analyticsRes, queueRes, recsRes] = await Promise.all([
      fetch('/api/analytics/dashboard'),
      fetch('/api/analytics/daily-queue'),
      fetch('/api/analytics/recommendations')
    ]);

    const analytics = await analyticsRes.json();
    const queue = await queueRes.json();
    const recs = await recsRes.json();

    // Summary metrics
    document.getElementById('metric-subjects').textContent = analytics.summary.total_subjects;
    document.getElementById('metric-chapters-sub').textContent = `${analytics.summary.completed_chapters} / ${analytics.summary.total_chapters} Chapters Completed`;
    document.getElementById('metric-due-cards').textContent = analytics.summary.overdue_cards + analytics.summary.due_today_cards;
    document.getElementById('metric-due-sub').textContent = `${analytics.summary.overdue_cards} Overdue • ${analytics.summary.due_today_cards} Due Today`;
    document.getElementById('metric-accuracy').textContent = `${analytics.summary.overall_accuracy}%`;
    document.getElementById('metric-tests-sub').textContent = `${analytics.summary.test_attempts} Completed Tests`;
    document.getElementById('metric-mistakes').textContent = analytics.summary.unresolved_mistakes;
    document.getElementById('metric-repeated-sub').textContent = `${analytics.summary.repeated_mistakes} Repeated Errors`;

    // AIR 1 Recommendations
    renderDashboardRecommendations(recs);

    // Chapter status table
    renderDashboardChapters(analytics.chapter_performance);

    // Daily Priority Queue
    renderDashboardQueue(queue);

    refreshGlobalBadges();
  } catch (err) {
    console.error('Failed to load dashboard:', err);
  }
}

function renderDashboardRecommendations(recs) {
  const container = document.getElementById('recommendations-container');
  if (!recs || recs.length === 0) {
    container.innerHTML = '<div style="font-size: 13px; color: var(--text-muted);">No urgent actions. Maintain daily flashcard revisions and attempt sectional practice tests.</div>';
    return;
  }

  container.innerHTML = recs.map(r => `
    <div style="display: flex; align-items: flex-start; justify-content: space-between; padding: 8px 0; border-bottom: 1px dashed var(--border); last-child:border-none;">
      <div style="flex: 1; padding-right: 14px;">
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 2px;">
          <span class="badge ${r.priority === 'Critical' ? 'badge-red' : r.priority === 'High' ? 'badge-amber' : 'badge-blue'}">${r.priority}</span>
          <strong style="font-size: 13px; color: var(--text-main);">${escapeHtml(r.title)}</strong>
        </div>
        <div style="font-size: 12px; color: var(--text-muted);">${escapeHtml(r.reason)}</div>
      </div>
      <button class="btn btn-secondary btn-sm" onclick="handleRecommendationAction('${r.action_type}')">${escapeHtml(r.action_label)}</button>
    </div>
  `).join('');
}

function handleRecommendationAction(type) {
  if (type === 'flashcards') startDailyRevisionSession();
  else if (type === 'mistakes') navigateTo('mistakes');
  else if (type === 'test') openTestConfigModal();
  else if (type === 'notes') navigateTo('notes');
  else navigateTo('dashboard');
}

function renderDashboardChapters(chapters) {
  const tbody = document.getElementById('dashboard-chapter-table');
  if (!chapters || chapters.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; color: var(--text-muted);">No chapters found. Add subjects and chapters to begin.</td></tr>';
    return;
  }

  tbody.innerHTML = chapters.map(c => `
    <tr>
      <td>
        <div style="font-weight: 600;">${escapeHtml(c.chapter_name)}</div>
        <div style="font-size: 11px; color: var(--text-muted);">${escapeHtml(c.subject_name)}</div>
      </td>
      <td>
        <span class="badge ${c.status === 'Completed' || c.status === 'Mastered' ? 'badge-green' : c.status === 'In Progress' ? 'badge-blue' : 'badge-gray'}">${c.status}</span>
      </td>
      <td>${c.note_count}</td>
      <td>${c.card_count} ${c.due_card_count > 0 ? `<span style="color:var(--status-danger); font-size:11px;">(${c.due_card_count} due)</span>` : ''}</td>
      <td>${c.accuracy !== null ? `${c.accuracy}%` : '<span style="color:var(--text-faint);">N/A</span>'}</td>
      <td>
        <div style="display: flex; gap: 6px;">
          <button class="btn btn-secondary btn-sm" onclick="startChapterTest(${c.id})">Test</button>
          <button class="btn btn-secondary btn-sm" onclick="generateCardsForChapter(${c.id})">Cards</button>
        </div>
      </td>
    </tr>
  `).join('');
}

function renderDashboardQueue(queue) {
  const container = document.getElementById('dashboard-queue-container');
  const cards = queue.due_cards || [];
  const mistakes = queue.unresolved_mistakes || [];

  if (cards.length === 0 && mistakes.length === 0) {
    container.innerHTML = '<div style="font-size: 13px; color: var(--text-muted); text-align: center; padding: 16px 0;">All scheduled revisions are complete. Great job!</div>';
    return;
  }

  let html = '';
  if (cards.length > 0) {
    html += `<div style="font-size: 11px; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">Due Flashcards (${cards.length})</div>`;
    html += cards.slice(0, 4).map(c => `
      <div style="padding: 8px 10px; background: var(--bg-subtle); border-radius: var(--radius-sm); border: 1px solid var(--border);">
        <div style="font-weight: 600; font-size: 12px; margin-bottom: 2px;">${escapeHtml(c.question)}</div>
        <div style="font-size: 10px; color: var(--text-muted);">${escapeHtml(c.subject_name)} • Due: ${c.due_date}</div>
      </div>
    `).join('');
  }

  if (mistakes.length > 0) {
    html += `<div style="font-size: 11px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; margin-top: 8px;">Active Mistakes to Review (${mistakes.length})</div>`;
    html += mistakes.slice(0, 3).map(m => `
      <div style="padding: 8px 10px; background: var(--status-danger-bg); border-radius: var(--radius-sm); border: 1px solid var(--border);">
        <div style="font-weight: 600; font-size: 12px; color: var(--status-danger); margin-bottom: 2px;">${escapeHtml(m.question_text)}</div>
        <div style="font-size: 10px; color: var(--text-muted);">Repeated ${m.repeated_count}x • ${escapeHtml(m.chapter_name)}</div>
      </div>
    `).join('');
  }

  container.innerHTML = html;
}

// ==========================================================================
// VIEW: MY SUBJECTS
// ==========================================================================
async function loadSubjectsList() {
  await fetchSubjectsCache();
  const grid = document.getElementById('subjects-grid');
  if (!subjectsCache || subjectsCache.length === 0) {
    grid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 40px 20px; background: var(--bg-card); border: 1px dashed var(--border); border-radius: var(--radius-lg);">
        <div style="font-size: 15px; font-weight: 600; margin-bottom: 6px;">No subjects created yet</div>
        <p style="font-size: 13px; color: var(--text-muted); margin-bottom: 16px;">You have full control. Add your SSC CHSL preparation subjects (e.g. Quantitative Aptitude, General Intelligence, English Language, General Awareness).</p>
        <button class="btn btn-primary" onclick="openSubjectModal()">+ Add Your First Subject</button>
      </div>
    `;
    return;
  }

  grid.innerHTML = subjectsCache.map(s => `
    <div class="card" style="border-top: 3px solid ${s.color || 'var(--accent-primary)'}; margin-bottom: 0;">
      <div class="card-header" style="margin-bottom: 10px; padding-bottom: 8px;">
        <div>
          <div class="card-title">${escapeHtml(s.name)}</div>
          <div class="card-desc">${escapeHtml(s.description || 'No description')}</div>
        </div>
      </div>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 14px; font-size: 12px; color: var(--text-muted);">
        <div>Chapters: <strong>${s.chapter_count}</strong></div>
        <div>Notes: <strong>${s.note_count}</strong></div>
        <div>Cards: <strong>${s.flashcard_count}</strong></div>
        <div>Active Mistakes: <strong>${s.mistake_count}</strong></div>
      </div>
      <div style="display: flex; gap: 6px; justify-content: flex-end; border-top: 1px solid var(--border); padding-top: 10px;">
        <button class="btn btn-secondary btn-sm" onclick="openChapterModal(${s.id})">+ Chapter</button>
        <button class="btn btn-secondary btn-sm" onclick="editSubject(${s.id})">Edit</button>
        <button class="btn btn-danger btn-sm" onclick="confirmDeleteSubject(${s.id}, '${escapeJsString(s.name)}')">Delete</button>
      </div>
    </div>
  `).join('');
}

function openSubjectModal(subject = null) {
  document.getElementById('form-subject').reset();
  document.getElementById('subject-edit-id').value = subject ? subject.id : '';
  document.getElementById('modal-subject-title').textContent = subject ? 'Edit Subject' : 'Add Subject';
  if (subject) {
    document.getElementById('subject-name').value = subject.name;
    document.getElementById('subject-desc').value = subject.description || '';
  }
  openModal('modal-subject');
}

function editSubject(subjectId) {
  const sub = subjectsCache.find(s => s.id === subjectId);
  if (sub) openSubjectModal(sub);
}

async function handleSubjectSubmit(event) {
  event.preventDefault();
  const id = document.getElementById('subject-edit-id').value;
  const name = document.getElementById('subject-name').value.trim();
  const description = document.getElementById('subject-desc').value.trim();

  try {
    const url = id ? `/api/subjects/${id}` : '/api/subjects';
    const method = id ? 'PUT' : 'POST';
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, description })
    });

    if (!res.ok) {
      const err = await res.json();
      showToast(err.detail || 'Failed to save subject.', 'danger');
      return;
    }

    closeModal('modal-subject');
    showToast(`Subject '${name}' saved.`, 'success');
    await fetchSubjectsCache();
    loadSubjectsList();
  } catch (err) {
    showToast('Failed to save subject.', 'danger');
  }
}

function confirmDeleteSubject(id, name) {
  showConfirmModal(
    'Delete Subject',
    `Are you sure you want to delete subject '${name}'? This will permanently delete all associated chapters, notes, flashcards, and test records.`,
    async () => {
      try {
        const res = await fetch(`/api/subjects/${id}`, { method: 'DELETE' });
        if (res.ok) {
          showToast(`Subject '${name}' deleted.`, 'success');
          await fetchSubjectsCache();
          loadSubjectsList();
        } else {
          showToast('Failed to delete subject.', 'danger');
        }
      } catch (e) {
        showToast('Error deleting subject.', 'danger');
      }
    }
  );
}

// ==========================================================================
// VIEW: CHAPTER LIBRARY
// ==========================================================================
async function loadChaptersList() {
  await fetchSubjectsCache();
  populateSubjectFilter('chapter-subject-filter', true);

  const filterSubId = document.getElementById('chapter-subject-filter').value;
  let url = '/api/subjects';
  
  try {
    const res = await fetch(url);
    const subjects = await res.json();
    let allChapters = [];

    for (const s of subjects) {
      if (filterSubId && String(s.id) !== String(filterSubId)) continue;
      const chRes = await fetch(`/api/subjects/${s.id}/chapters`);
      const chapters = await chRes.json();
      allChapters.push(...chapters.map(c => ({ ...c, subject_name: s.name })));
    }

    chaptersCache = allChapters;
    renderChaptersTable(allChapters);
  } catch (e) {
    console.error('Failed to load chapters:', e);
  }
}

function filterChaptersBySubject() {
  loadChaptersList();
}

function renderChaptersTable(chapters) {
  const tbody = document.getElementById('chapters-table-body');
  if (!chapters || chapters.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; color: var(--text-muted);">No chapters found. Click "+ Add Chapter" to create your first chapter.</td></tr>';
    return;
  }

  tbody.innerHTML = chapters.map(c => `
    <tr>
      <td style="font-size: 11px; color: var(--text-muted); font-weight: 600;">${escapeHtml(c.subject_name)}</td>
      <td>
        <div style="font-weight: 600;">${escapeHtml(c.name)}</div>
        <div style="font-size: 11px; color: var(--text-muted);">${escapeHtml(c.description || '')}</div>
      </td>
      <td>${c.topic_count} Topics</td>
      <td>${c.note_count} Notes</td>
      <td>${c.flashcard_count} ${c.due_cards_count > 0 ? `<span style="color:var(--status-danger); font-size:11px;">(${c.due_cards_count} due)</span>` : ''}</td>
      <td>${c.avg_accuracy !== null ? `${c.avg_accuracy}%` : '<span style="color:var(--text-faint);">N/A</span>'}</td>
      <td>
        <select class="form-control" style="padding: 2px 6px; font-size: 11px; width: 110px;" onchange="updateChapterStatus(${c.id}, this.value)">
          <option value="Not Started" ${c.status === 'Not Started' ? 'selected' : ''}>Not Started</option>
          <option value="In Progress" ${c.status === 'In Progress' ? 'selected' : ''}>In Progress</option>
          <option value="Completed" ${c.status === 'Completed' ? 'selected' : ''}>Completed</option>
          <option value="Mastered" ${c.status === 'Mastered' ? 'selected' : ''}>Mastered</option>
        </select>
      </td>
      <td>
        <div style="display: flex; gap: 4px;">
          <button class="btn btn-secondary btn-sm" onclick="openNotePasteModal(${c.subject_id}, ${c.id})">+ Note</button>
          <button class="btn btn-secondary btn-sm" onclick="generateCardsForChapter(${c.id})">Cards</button>
          <button class="btn btn-secondary btn-sm" onclick="startChapterTest(${c.id})">Test</button>
          <button class="btn btn-danger btn-sm" onclick="confirmDeleteChapter(${c.id}, '${escapeJsString(c.name)}')">Delete</button>
        </div>
      </td>
    </tr>
  `).join('');
}

function openChapterModal(preselectedSubjectId = null) {
  document.getElementById('form-chapter').reset();
  document.getElementById('chapter-edit-id').value = '';
  populateSubjectSelect('chapter-subject-select', preselectedSubjectId);
  openModal('modal-chapter');
}

async function handleChapterSubmit(event) {
  event.preventDefault();
  const id = document.getElementById('chapter-edit-id').value;
  const subject_id = parseInt(document.getElementById('chapter-subject-select').value);
  const name = document.getElementById('chapter-name').value.trim();
  const description = document.getElementById('chapter-desc').value.trim();
  const status = document.getElementById('chapter-status').value;

  try {
    const url = id ? `/api/chapters/${id}` : '/api/chapters';
    const method = id ? 'PUT' : 'POST';
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subject_id, name, description, status })
    });

    if (!res.ok) {
      const err = await res.json();
      showToast(err.detail || 'Failed to save chapter.', 'danger');
      return;
    }

    closeModal('modal-chapter');
    showToast(`Chapter '${name}' saved.`, 'success');
    loadChaptersList();
  } catch (err) {
    showToast('Error saving chapter.', 'danger');
  }
}

async function updateChapterStatus(chapterId, newStatus) {
  try {
    await fetch(`/api/chapters/${chapterId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus })
    });
    showToast(`Chapter status updated to ${newStatus}.`, 'success');
  } catch (e) {
    showToast('Failed to update status.', 'danger');
  }
}

function confirmDeleteChapter(id, name) {
  showConfirmModal(
    'Delete Chapter',
    `Are you sure you want to delete chapter '${name}'? This will remove all associated notes, flashcards, and test history.`,
    async () => {
      try {
        const res = await fetch(`/api/chapters/${id}`, { method: 'DELETE' });
        if (res.ok) {
          showToast(`Chapter '${name}' deleted.`, 'success');
          loadChaptersList();
        } else {
          showToast('Failed to delete chapter.', 'danger');
        }
      } catch (e) {
        showToast('Error deleting chapter.', 'danger');
      }
    }
  );
}

// ==========================================================================
// VIEW: MY NOTES
// ==========================================================================
async function loadNotesList() {
  await fetchSubjectsCache();
  populateChapterFilter('notes-chapter-filter');

  const chapterId = document.getElementById('notes-chapter-filter').value;
  let url = '/api/notes';
  if (chapterId) url += `?chapter_id=${chapterId}`;

  try {
    const res = await fetch(url);
    const notes = await res.json();
    renderNotesTable(notes);
  } catch (e) {
    console.error('Failed to load notes:', e);
  }
}

function renderNotesTable(notes) {
  const tbody = document.getElementById('notes-table-body');
  if (!notes || notes.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; color: var(--text-muted);">No study notes found. Upload a PDF or paste notes to begin.</td></tr>';
    return;
  }

  tbody.innerHTML = notes.map(n => `
    <tr>
      <td>
        <div style="font-weight: 600; cursor: pointer; color: var(--accent-primary-text);" onclick="openNoteViewModal(${n.id})">${escapeHtml(n.title)}</div>
        <div style="font-size: 11px; color: var(--text-faint);">${n.created_at}</div>
      </td>
      <td>
        <div style="font-weight: 500;">${escapeHtml(n.chapter_name)}</div>
        <div style="font-size: 11px; color: var(--text-muted);">${escapeHtml(n.subject_name)}</div>
      </td>
      <td><span class="badge badge-gray">${n.source_type.toUpperCase()}</span></td>
      <td>
        <span class="badge ${n.extraction_status === 'processed' ? 'badge-green' : 'badge-amber'}">${n.extraction_status}</span>
      </td>
      <td>${n.generated_cards_count} Cards</td>
      <td>${n.generated_questions_count} Qs</td>
      <td>
        <div style="display: flex; gap: 4px; flex-wrap: wrap;">
          <button class="btn btn-secondary btn-sm" onclick="openNoteViewModal(${n.id})">Edit</button>
          <button class="btn btn-secondary btn-sm" onclick="convertNoteToFlashcards(${n.id})">To Cards</button>
          <button class="btn btn-secondary btn-sm" onclick="convertNoteToQuestions(${n.id})">To MCQs</button>
          <button class="btn btn-danger btn-sm" onclick="confirmDeleteNote(${n.id}, '${escapeJsString(n.title)}')">Delete</button>
        </div>
      </td>
    </tr>
  `).join('');
}

function openNotePasteModal(preSubId = null, preChapId = null) {
  document.getElementById('form-note-paste').reset();
  populateSubjectSelect('paste-subject-select', preSubId);
  populateChapterSelect('paste-subject-select', 'paste-chapter-select', preChapId);
  openModal('modal-note-paste');
}

async function handleNotePasteSubmit(event) {
  event.preventDefault();
  const subject_id = parseInt(document.getElementById('paste-subject-select').value);
  const chapter_id = parseInt(document.getElementById('paste-chapter-select').value);
  const title = document.getElementById('paste-note-title').value.trim();
  const content = document.getElementById('paste-note-content').value.trim();

  try {
    const res = await fetch('/api/notes/paste', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subject_id, chapter_id, title, content })
    });

    if (!res.ok) {
      const err = await res.json();
      showToast(err.detail || 'Failed to save note.', 'danger');
      return;
    }

    closeModal('modal-note-paste');
    showToast('Note saved successfully.', 'success');
    loadNotesList();
  } catch (err) {
    showToast('Error saving note.', 'danger');
  }
}

function openNoteUploadModal() {
  document.getElementById('form-note-upload').reset();
  populateSubjectSelect('upload-subject-select');
  populateChapterSelect('upload-subject-select', 'upload-chapter-select');
  openModal('modal-note-upload');
}

async function handleNoteUploadSubmit(event) {
  event.preventDefault();
  const subject_id = document.getElementById('upload-subject-select').value;
  const chapter_id = document.getElementById('upload-chapter-select').value;
  const title = document.getElementById('upload-note-title').value.trim();
  const fileInput = document.getElementById('upload-file-input');

  if (!fileInput.files || fileInput.files.length === 0) {
    showToast('Please select a document file.', 'danger');
    return;
  }

  const formData = new FormData();
  formData.append('subject_id', subject_id);
  formData.append('chapter_id', chapter_id);
  formData.append('title', title);
  formData.append('file', fileInput.files[0]);

  showToast('Extracting document text...', 'info');

  try {
    const res = await fetch('/api/notes/upload', {
      method: 'POST',
      body: formData
    });

    if (!res.ok) {
      const err = await res.json();
      showToast(err.detail || 'Document processing failed.', 'danger');
      return;
    }

    const note = await res.json();
    closeModal('modal-note-upload');
    showToast(`Document processed: ${note.extraction_notes}`, 'success');
    loadNotesList();
    openNoteViewModal(note.id); // Open immediately for user review
  } catch (err) {
    showToast('Upload failed.', 'danger');
  }
}

async function openNoteViewModal(noteId) {
  try {
    const res = await fetch(`/api/notes/${noteId}`);
    if (!res.ok) return;
    const note = await res.json();

    document.getElementById('note-view-id').value = note.id;
    document.getElementById('note-view-title').textContent = note.title;
    document.getElementById('note-view-input-title').value = note.title;
    document.getElementById('note-view-meta').textContent = `Subject: ${note.subject_name} | Chapter: ${note.chapter_name} | Source: ${note.source_type.toUpperCase()} | Added: ${note.created_at}`;
    document.getElementById('note-view-extracted-content').value = note.extracted_content || note.raw_content;
    document.getElementById('note-view-extraction-info').textContent = `Extraction status: ${note.extraction_status} (${note.extraction_notes || 'Clean'})`;

    openModal('modal-note-view');
  } catch (e) {
    showToast('Failed to load note details.', 'danger');
  }
}

async function saveNoteEdits() {
  const noteId = document.getElementById('note-view-id').value;
  const title = document.getElementById('note-view-input-title').value.trim();
  const extracted_content = document.getElementById('note-view-extracted-content').value.trim();

  try {
    const res = await fetch(`/api/notes/${noteId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, extracted_content })
    });
    if (res.ok) {
      showToast('Note corrections saved.', 'success');
      closeModal('modal-note-view');
      loadNotesList();
    }
  } catch (e) {
    showToast('Failed to save corrections.', 'danger');
  }
}

function confirmDeleteNote(id, title) {
  showConfirmModal('Delete Note', `Are you sure you want to delete note '${title}'?`, async () => {
    try {
      const res = await fetch(`/api/notes/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('Note deleted.', 'success');
        loadNotesList();
      }
    } catch (e) {
      showToast('Error deleting note.', 'danger');
    }
  });
}

// ==========================================================================
// VIEW: FLASHCARDS & GENERATION STUDIO
// ==========================================================================
async function loadFlashcardsList() {
  await fetchSubjectsCache();
  populateChapterFilter('flashcard-chapter-filter');

  const chapterId = document.getElementById('flashcard-chapter-filter').value;
  let url = '/api/flashcards?limit=150';
  if (chapterId) url += `&chapter_id=${chapterId}`;

  try {
    const res = await fetch(url);
    const cards = await res.json();
    renderFlashcardsTable(cards);
  } catch (e) {
    console.error('Failed to load cards:', e);
  }
}

function renderFlashcardsTable(cards) {
  const tbody = document.getElementById('flashcards-table-body');
  if (!cards || cards.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; color: var(--text-muted);">No flashcards found. Click "Generate Flashcards" to create cards from your notes.</td></tr>';
    return;
  }

  tbody.innerHTML = cards.map(c => `
    <tr>
      <td><span class="badge badge-blue">${c.card_type.toUpperCase()}</span></td>
      <td style="font-weight: 600; max-width: 260px;">${escapeHtml(c.question)}</td>
      <td style="color: var(--text-muted); font-size: 12px; max-width: 220px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${escapeHtml(c.answer)}</td>
      <td>
        <div style="font-weight: 500;">${escapeHtml(c.chapter_name)}</div>
        <div style="font-size: 10px; color: var(--text-muted);">${escapeHtml(c.subject_name)}</div>
      </td>
      <td>${c.interval_days}d</td>
      <td>${c.ease_factor}</td>
      <td>
        <span class="${isOverdueDate(c.due_date) ? 'badge badge-red' : 'badge badge-gray'}">${c.due_date}</span>
      </td>
      <td>
        <button class="btn btn-danger btn-sm" onclick="confirmDeleteCard(${c.id})">Delete</button>
      </td>
    </tr>
  `).join('');
}

function isOverdueDate(dateStr) {
  const today = new Date().toISOString().split('T')[0];
  return dateStr <= today;
}

function confirmDeleteCard(id) {
  showConfirmModal('Delete Flashcard', 'Delete this flashcard permanently?', async () => {
    try {
      await fetch(`/api/flashcards/${id}`, { method: 'DELETE' });
      showToast('Card deleted.', 'success');
      loadFlashcardsList();
    } catch (e) {
      showToast('Error deleting card.', 'danger');
    }
  });
}

// ==========================================================================
// FLASHCARD IMPORTER & DIRECT Q&A PARSER
// ==========================================================================

function openFlashcardImporterModal(preSubId = null, preChapId = null, preText = '') {
  document.getElementById('form-flashcard-importer').reset();
  populateSubjectSelect('import-card-subject-select', preSubId);
  populateChapterSelect('import-card-subject-select', 'import-card-chapter-select', preChapId);
  if (preText) {
    document.getElementById('import-card-raw-text').value = preText;
  }
  openModal('modal-flashcard-importer');
}

async function loadFlashcardDemoFormat() {
  try {
    const res = await fetch('/api/flashcards/demo-template');
    const data = await res.json();
    document.getElementById('import-card-raw-text').value = data.template;
    showToast('Loaded Flashcard Demo Format!', 'info');
  } catch (e) {
    document.getElementById('import-card-raw-text').value = `Q: What is the 73rd Constitutional Amendment Act related to?\nA: Panchayati Raj Institutions (1992)\n\nQ: State the formula for Compound Interest.\nA: Amount = P * (1 + R/100)^T\n\nQ: Exception to general trend of ionization enthalpy in Period 2?\nA: Boron is lower than Beryllium due to 2p electron removal.`;
  }
}

async function previewPastedFlashcards() {
  const subject_id = parseInt(document.getElementById('import-card-subject-select').value);
  const chapter_id = parseInt(document.getElementById('import-card-chapter-select').value);
  const raw_text = document.getElementById('import-card-raw-text').value.trim();

  if (!raw_text) {
    showToast('Please paste some question and answer text first.', 'warning');
    return;
  }

  try {
    const res = await fetch('/api/flashcards/parse-text', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subject_id: subject_id || 1, chapter_id: chapter_id || 1, raw_text })
    });
    if (!res.ok) {
      const err = await res.json();
      showToast(err.detail || 'Could not parse Q&A cards.', 'danger');
      return;
    }
    const data = await res.json();
    showToast(`Successfully parsed ${data.count} flashcard(s)! Ready to save.`, 'success');
  } catch (e) {
    showToast('Error parsing text.', 'danger');
  }
}

async function handleFlashcardImportSubmit(event) {
  event.preventDefault();
  const subject_id = parseInt(document.getElementById('import-card-subject-select').value);
  const chapter_id = parseInt(document.getElementById('import-card-chapter-select').value);
  const raw_text = document.getElementById('import-card-raw-text').value.trim();

  if (!subject_id || !chapter_id) {
    showToast('Please select a subject and chapter.', 'danger');
    return;
  }
  if (!raw_text) {
    showToast('Please enter your questions and answers.', 'danger');
    return;
  }

  try {
    const res = await fetch('/api/flashcards/import-text', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subject_id, chapter_id, raw_text })
    });

    if (!res.ok) {
      const err = await res.json();
      showToast(err.detail || 'Failed to import flashcards.', 'danger');
      return;
    }

    const data = await res.json();
    closeModal('modal-flashcard-importer');
    showToast(data.message, 'success');
    loadFlashcardsList();
    refreshGlobalBadges();
  } catch (err) {
    showToast('Failed to import flashcards.', 'danger');
  }
}

// ==========================================================================
// PRACTICE QUESTION (MCQ) IMPORTER & DIRECT PARSER
// ==========================================================================

function openQuestionImporterModal(preSubId = null, preChapId = null, preText = '') {
  document.getElementById('form-question-importer').reset();
  populateSubjectSelect('import-q-subject-select', preSubId);
  populateChapterSelect('import-q-subject-select', 'import-q-chapter-select', preChapId);
  if (preText) {
    document.getElementById('import-q-raw-text').value = preText;
  }
  openModal('modal-question-importer');
}

async function loadPracticeQuestionDemoFormat() {
  try {
    const res = await fetch('/api/tests/demo-template');
    const data = await res.json();
    document.getElementById('import-q-raw-text').value = data.template;
    showToast('Loaded Practice Questions Demo Format!', 'info');
  } catch (e) {
    document.getElementById('import-q-raw-text').value = `Q: If a 9-digit number 785x3678y is divisible by 72, find (x - y).\nA) 2\nB) -1\nC) 0\nD) 1\nCorrect: A\nExplanation: Divisibility by 8 and 9 gives y=4, x=6. Hence x - y = 2.\nTopic: Number Systems\n\n---\n\nQ: Which Article guarantees Equality before Law in India?\nA) Article 14\nB) Article 19\nC) Article 21\nD) Article 32\nCorrect: A\nExplanation: Article 14 guarantees equality before law.`;
  }
}

async function handleQuestionImportSubmit(event) {
  event.preventDefault();
  const subject_id = parseInt(document.getElementById('import-q-subject-select').value);
  const chapter_id = parseInt(document.getElementById('import-q-chapter-select').value);
  const raw_text = document.getElementById('import-q-raw-text').value.trim();

  if (!subject_id || !chapter_id) {
    showToast('Please select a subject and chapter.', 'danger');
    return;
  }
  if (!raw_text) {
    showToast('Please paste your questions.', 'danger');
    return;
  }

  try {
    const res = await fetch('/api/tests/import-text', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subject_id, chapter_id, raw_text })
    });

    if (!res.ok) {
      const err = await res.json();
      showToast(err.detail || 'Failed to import questions.', 'danger');
      return;
    }

    const data = await res.json();
    closeModal('modal-question-importer');
    showToast(data.message, 'success');
    loadPracticeQuestionsList();
  } catch (err) {
    showToast('Error importing questions.', 'danger');
  }
}

// ==========================================================================
// CONVERT NOTE DIRECTLY TO FLASHCARDS / QUESTIONS
// ==========================================================================

async function convertNoteToFlashcards(noteId) {
  try {
    const res = await fetch(`/api/notes/${noteId}`);
    if (!res.ok) return;
    const note = await res.json();
    openFlashcardImporterModal(note.subject_id, note.chapter_id, note.extracted_content || note.raw_content);
  } catch (e) {
    showToast('Error loading note.', 'danger');
  }
}

async function convertNoteToQuestions(noteId) {
  try {
    const res = await fetch(`/api/notes/${noteId}`);
    if (!res.ok) return;
    const note = await res.json();
    openQuestionImporterModal(note.subject_id, note.chapter_id, note.extracted_content || note.raw_content);
  } catch (e) {
    showToast('Error loading note.', 'danger');
  }
}

// ==========================================================================
// INTERACTIVE FLASHCARD REVISION (ACTIVE RECALL & SM-2)
// ==========================================================================
async function startDailyRevisionSession() {
  try {
    const res = await fetch('/api/flashcards?due_only=true&limit=60');
    const cards = await res.json();

    if (!cards || cards.length === 0) {
      showToast('No flashcards due for revision today! All caught up.', 'success');
      return;
    }

    studyQueue = cards;
    currentStudyIndex = 0;
    studySessionStats = { total: cards.length, correct: 0, lapses: 0 };

    document.getElementById('study-session-body').style.display = 'block';
    document.getElementById('study-summary-view').style.display = 'none';

    renderCurrentStudyCard();
    openModal('modal-flashcard-study');
  } catch (e) {
    showToast('Failed to start revision session.', 'danger');
  }
}

function renderCurrentStudyCard() {
  if (currentStudyIndex >= studyQueue.length) {
    finishStudySession();
    return;
  }

  const card = studyQueue[currentStudyIndex];
  cardStartTime = Date.now();

  document.getElementById('study-card-counter').textContent = `Card ${currentStudyIndex + 1} of ${studyQueue.length}`;
  document.getElementById('study-card-chapter').textContent = `${card.subject_name} • ${card.chapter_name}`;
  document.getElementById('study-card-type').textContent = card.card_type.toUpperCase();
  document.getElementById('study-question-text').textContent = card.question;
  document.getElementById('study-answer-text').textContent = card.answer;
  document.getElementById('study-source-ref').textContent = `Source: ${card.source_reference || card.chapter_name}`;

  // Hide answer first for Active Recall
  document.getElementById('study-answer-box').style.display = 'none';
  document.getElementById('study-reveal-control').style.display = 'block';
  document.getElementById('study-rating-controls').style.display = 'none';
}

function revealFlashcardAnswer() {
  document.getElementById('study-answer-box').style.display = 'block';
  document.getElementById('study-reveal-control').style.display = 'none';
  document.getElementById('study-rating-controls').style.display = 'block';
}

async function submitCardRating(rating) {
  const card = studyQueue[currentStudyIndex];
  const timeElapsed = Date.now() - cardStartTime;

  if (rating >= 3) studySessionStats.correct++;
  else studySessionStats.lapses++;

  try {
    await fetch('/api/flashcards/review', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        card_id: card.id,
        rating,
        review_time_ms: timeElapsed
      })
    });
  } catch (e) {
    console.error('Failed to submit card review:', e);
  }

  currentStudyIndex++;
  renderCurrentStudyCard();
}

function finishStudySession() {
  document.getElementById('study-session-body').style.display = 'none';
  document.getElementById('study-summary-view').style.display = 'block';
  document.getElementById('summary-reviewed-count').textContent = studySessionStats.total;
  document.getElementById('summary-correct-count').textContent = studySessionStats.correct;
  document.getElementById('summary-lapse-count').textContent = studySessionStats.lapses;

  refreshGlobalBadges();
  loadRevisionSchedule();
}

function closeFlashcardStudyModal() {
  closeModal('modal-flashcard-study');
  loadFlashcardsList();
  loadDashboard();
}

// ==========================================================================
// VIEW: PRACTICE TESTS, QUESTION BANK & EXAM SIMULATOR
// ==========================================================================

async function loadPracticeQuestionsList() {
  await fetchSubjectsCache();
  populateChapterFilter('tests-chapter-filter');

  const filterEl = document.getElementById('tests-chapter-filter');
  const chapterId = filterEl ? filterEl.value : '';
  let url = '/api/tests/questions';
  if (chapterId) url += `?chapter_id=${chapterId}`;

  try {
    const res = await fetch(url);
    const questions = await res.json();
    renderPracticeQuestionsTable(questions);
  } catch (e) {
    console.error('Failed to load practice questions:', e);
  }
}

function renderPracticeQuestionsTable(questions) {
  const tbody = document.getElementById('practice-questions-table-body');
  if (!tbody) return;

  if (!questions || questions.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; color: var(--text-muted); padding: 24px;">No practice MCQs found in question bank. Click <strong>"+ Paste Questions (MCQs)"</strong> above to paste your multiple-choice questions.</td></tr>';
    return;
  }

  tbody.innerHTML = questions.map((q, idx) => {
    const optionsHtml = (q.options || []).map((opt, oIdx) => {
      const letter = String.fromCharCode(65 + oIdx);
      const isCorrect = (q.correct_answer || '').trim().toLowerCase() === opt.trim().toLowerCase();
      return `<div style="font-size: 11px; margin-bottom: 2px; ${isCorrect ? 'color: var(--status-success); font-weight: 600;' : 'color: var(--text-muted);'}">
        <strong>${letter})</strong> ${escapeHtml(opt)}
      </div>`;
    }).join('');

    return `
      <tr>
        <td style="font-weight: 600; color: var(--text-muted);">${idx + 1}</td>
        <td>
          <div style="font-weight: 600; margin-bottom: 4px; line-height: 1.4;">${escapeHtml(q.question_text)}</div>
          ${q.explanation ? `<div style="font-size: 11px; color: var(--text-faint); font-style: italic;">Exp: ${escapeHtml(q.explanation)}</div>` : ''}
        </td>
        <td>
          <div style="max-height: 120px; overflow-y: auto;">${optionsHtml}</div>
        </td>
        <td>
          <span class="badge badge-green">${escapeHtml(q.correct_answer || 'N/A')}</span>
        </td>
        <td>
          <div style="font-weight: 600;">${escapeHtml(q.chapter_name || '')}</div>
          <div style="font-size: 11px; color: var(--text-muted);">${escapeHtml(q.subject_name || '')}</div>
        </td>
        <td>
          <span class="badge ${q.difficulty === 'Easy' ? 'badge-green' : q.difficulty === 'Hard' ? 'badge-red' : 'badge-amber'}">${escapeHtml(q.difficulty || 'Medium')}</span>
        </td>
        <td>
          <div style="display: flex; gap: 4px;">
            <button class="btn btn-primary btn-sm" onclick="startChapterTest(${q.subject_id}, ${q.chapter_id})" title="Start Test on this Chapter">Test</button>
            <button class="btn btn-danger btn-sm" onclick="confirmDeleteQuestion(${q.id})" title="Delete Question">Delete</button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function confirmDeleteQuestion(questionId) {
  showConfirmModal(
    'Delete Practice Question',
    'Are you sure you want to delete this question from your Question Bank?',
    async () => {
      try {
        const res = await fetch(`/api/tests/questions/${questionId}`, { method: 'DELETE' });
        if (res.ok) {
          showToast('Question deleted.', 'success');
          loadPracticeQuestionsList();
        } else {
          showToast('Failed to delete question.', 'danger');
        }
      } catch (e) {
        showToast('Error deleting question.', 'danger');
      }
    }
  );
}

async function loadTestsHistory() {
  try {
    const res = await fetch('/api/tests/history');
    const tests = await res.json();
    renderTestsHistoryTable(tests);
  } catch (e) {
    console.error('Failed to load test history:', e);
  }
}

function renderTestsHistoryTable(tests) {
  const tbody = document.getElementById('tests-history-table-body');
  if (!tbody) return;
  if (!tests || tests.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; color: var(--text-muted);">No tests completed yet. Click "+ Start Practice Test" to begin.</td></tr>';
    return;
  }

  tbody.innerHTML = tests.map(t => `
    <tr>
      <td>
        <div style="font-weight: 600;">${escapeHtml(t.title)}</div>
        <div style="font-size: 11px; color: var(--text-muted);">${escapeHtml(t.subject_name || '')} • ${escapeHtml(t.chapter_name || '')}</div>
      </td>
      <td><span class="badge ${t.test_mode === 'exam' ? 'badge-blue' : 'badge-gray'}">${t.test_mode.toUpperCase()}</span></td>
      <td>${t.question_count} Qs</td>
      <td style="font-weight: 700;">${t.score} / ${t.max_score}</td>
      <td>
        <span class="${t.accuracy >= 70 ? 'badge badge-green' : t.accuracy >= 50 ? 'badge badge-amber' : 'badge badge-red'}">${t.accuracy}%</span>
      </td>
      <td>${Math.floor(t.time_taken_seconds / 60)}m ${t.time_taken_seconds % 60}s</td>
      <td style="font-size: 11px; color: var(--text-muted);">${t.completed_at || t.started_at}</td>
      <td>
        <button class="btn btn-secondary btn-sm" onclick="viewTestResults(${t.id})">Review Solutions</button>
      </td>
    </tr>
  `).join('');
}

async function openTestConfigModal(preSubId = null, preChapId = null) {
  document.getElementById('form-test-config').reset();
  populateSubjectSelect('test-subject-select', preSubId);
  await populateChapterSelect('test-subject-select', 'test-chapter-select', preChapId);
  openModal('modal-test-config');
}

async function startChapterTest(arg1, arg2 = null) {
  let subId = null;
  let chapId = null;
  if (arg2 !== null) {
    subId = arg1;
    chapId = arg2;
  } else {
    chapId = arg1;
    const found = chaptersCache.find(c => String(c.id) === String(chapId));
    if (found) subId = found.subject_id;
  }
  await openTestConfigModal(subId, chapId);
}

async function handleStartTest(event) {
  event.preventDefault();
  const subSelect = document.getElementById('test-subject-select');
  const chapSelect = document.getElementById('test-chapter-select');
  const subject_id = parseInt(subSelect ? subSelect.value : 0);
  const chapVal = chapSelect ? chapSelect.value : '';
  const chapter_id = chapVal ? parseInt(chapVal) : null;
  const num_questions = parseInt(document.getElementById('test-question-count').value);
  const difficulty = document.getElementById('test-difficulty').value;
  const test_mode = document.getElementById('test-mode').value;
  const include_mistakes = document.getElementById('test-include-mistakes').checked;

  if (!subject_id) {
    showToast('Please select a subject.', 'danger');
    return;
  }

  showToast('Preparing test questions...', 'info');

  try {
    const res = await fetch('/api/tests/generate-and-start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subject_id, chapter_id, num_questions, difficulty, test_mode, include_mistakes
      })
    });

    if (!res.ok) {
      const err = await res.json();
      showToast(err.detail || 'Could not generate test. Check questions in chapter.', 'danger');
      return;
    }

    const testData = await res.json();
    closeModal('modal-test-config');
    launchExamSimulator(testData);
  } catch (err) {
    console.error('Test initiation error:', err);
    showToast(err.message || 'Failed to initiate test.', 'danger');
  }
}

function launchExamSimulator(testData) {
  try {
    currentExamAttempt = testData.attempt;
    currentExamQuestions = testData.questions || [];
    currentExamQuestionIndex = 0;
    examTimeElapsedSeconds = 0;

    const titleEl = document.getElementById('exam-sim-title');
    if (titleEl) titleEl.textContent = currentExamAttempt.title || 'Practice Examination';

    const subEl = document.getElementById('exam-sim-sub');
    if (subEl) subEl.textContent = `${currentExamQuestions.length} Questions • Mode: ${(currentExamAttempt.test_mode || 'EXAM').toUpperCase()}`;

    startExamTimer();
    renderExamQuestion();
    openModal('modal-exam-simulator');
  } catch (err) {
    console.error('Exam simulator launch error:', err);
    showToast('Failed to display exam: ' + err.message, 'danger');
  }
}

function startExamTimer() {
  if (examTimerInterval) clearInterval(examTimerInterval);
  const timerDisplay = document.getElementById('exam-timer-display');
  
  examTimerInterval = setInterval(() => {
    examTimeElapsedSeconds++;
    const mins = String(Math.floor(examTimeElapsedSeconds / 60)).padStart(2, '0');
    const secs = String(examTimeElapsedSeconds % 60).padStart(2, '0');
    if (timerDisplay) timerDisplay.textContent = `${mins}:${secs}`;
  }, 1000);
}

function renderExamQuestion() {
  const q = currentExamQuestions[currentExamQuestionIndex];
  if (!q) return;

  const currentQEl = document.getElementById('exam-current-q-index');
  if (currentQEl) currentQEl.textContent = `Question ${currentExamQuestionIndex + 1} of ${currentExamQuestions.length}`;

  const topicEl = document.getElementById('exam-q-topic');
  if (topicEl) topicEl.textContent = q.topic_name || 'General';

  const textEl = document.getElementById('exam-q-text');
  if (textEl) textEl.textContent = q.question_text;

  // Options
  const container = document.getElementById('exam-options-container');
  const options = q.options || [];

  if (container) {
    container.innerHTML = options.map((opt, idx) => {
      const isSelected = q.user_answer === opt;
      return `
        <div class="exam-option-item ${isSelected ? 'selected' : ''}" onclick="selectExamOptionIndex(${idx})">
          <input type="radio" name="exam-option" class="exam-option-radio" ${isSelected ? 'checked' : ''}>
          <div><strong>Option ${String.fromCharCode(65 + idx)}:</strong> ${escapeHtml(opt)}</div>
        </div>
      `;
    }).join('');
  }

  // Update mark for review button text
  const markBtn = document.getElementById('btn-mark-review');
  if (markBtn) {
    markBtn.textContent = q.is_marked_for_review ? 'Unmark Review' : 'Mark for Review';
  }

  renderExamPalette();
}

function renderExamPalette() {
  const grid = document.getElementById('exam-palette-grid');
  if (!grid || !currentExamQuestions) return;
  grid.innerHTML = currentExamQuestions.map((q, idx) => {
    let classes = ['palette-btn'];
    if (idx === currentExamQuestionIndex) classes.push('current');

    if (q.is_marked_for_review && q.user_answer) classes.push('marked-answered');
    else if (q.is_marked_for_review) classes.push('marked');
    else if (q.user_answer) classes.push('answered');

    return `
      <button class="${classes.join(' ')}" onclick="jumpToExamQuestion(${idx})">
        ${idx + 1}
      </button>
    `;
  }).join('');
}

function selectExamOptionIndex(idx) {
  const q = currentExamQuestions[currentExamQuestionIndex];
  if (!q || !q.options || idx >= q.options.length) return;
  q.user_answer = q.options[idx];
  renderExamQuestion();
  saveCurrentExamResponse();
}

function selectExamOption(option) {
  const q = currentExamQuestions[currentExamQuestionIndex];
  if (!q) return;
  q.user_answer = option;
  renderExamQuestion();
  saveCurrentExamResponse();
}

function clearSelectedOption() {
  const q = currentExamQuestions[currentExamQuestionIndex];
  q.user_answer = null;
  renderExamQuestion();
  saveCurrentExamResponse();
}

function toggleMarkForReview() {
  const q = currentExamQuestions[currentExamQuestionIndex];
  q.is_marked_for_review = !q.is_marked_for_review;
  renderExamQuestion();
  saveCurrentExamResponse();
}

function nextExamQuestion() {
  if (currentExamQuestionIndex < currentExamQuestions.length - 1) {
    currentExamQuestionIndex++;
    renderExamQuestion();
  } else {
    showToast('You have reached the last question.', 'info');
  }
}

function prevExamQuestion() {
  if (currentExamQuestionIndex > 0) {
    currentExamQuestionIndex--;
    renderExamQuestion();
  }
}

function jumpToExamQuestion(index) {
  currentExamQuestionIndex = index;
  renderExamQuestion();
}

async function saveCurrentExamResponse() {
  const q = currentExamQuestions[currentExamQuestionIndex];
  if (!currentExamAttempt || !q) return;

  try {
    await fetch('/api/tests/save-response', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        attempt_id: currentExamAttempt.id,
        question_id: q.question_id,
        user_answer: q.user_answer || '',
        is_marked_for_review: q.is_marked_for_review || false,
        time_spent_seconds: 0
      })
    });
  } catch (e) {}
}

function confirmSubmitTest() {
  const answered = currentExamQuestions.filter(q => !!q.user_answer).length;
  const total = currentExamQuestions.length;

  showConfirmModal(
    'Submit Examination',
    `You have answered ${answered} out of ${total} questions. Are you sure you want to finalize your submission?`,
    () => finalizeTestSubmission()
  );
}

async function finalizeTestSubmission() {
  if (examTimerInterval) clearInterval(examTimerInterval);

  try {
    const res = await fetch('/api/tests/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        attempt_id: currentExamAttempt.id,
        time_taken_seconds: examTimeElapsedSeconds
      })
    });

    closeModal('modal-exam-simulator');

    if (res.ok) {
      const resultData = await res.json();
      displayTestResultsModal(resultData);
      loadTestsHistory();
      refreshGlobalBadges();
    }
  } catch (e) {
    showToast('Error submitting test.', 'danger');
  }
}

async function viewTestResults(attemptId) {
  try {
    const res = await fetch(`/api/tests/attempt/${attemptId}`);
    if (res.ok) {
      const data = await res.json();
      displayTestResultsModal(data);
    }
  } catch (e) {}
}

function displayTestResultsModal(data) {
  const attempt = data.attempt;
  const questions = data.questions || [];

  document.getElementById('res-score-val').textContent = attempt.score;
  document.getElementById('res-max-score-sub').textContent = `Max: ${attempt.max_score}`;
  document.getElementById('res-accuracy-val').textContent = `${attempt.accuracy}%`;
  document.getElementById('res-time-sub').textContent = `Time: ${Math.floor(attempt.time_taken_seconds / 60)}m ${attempt.time_taken_seconds % 60}s`;
  document.getElementById('res-correct-val').textContent = attempt.correct_count;
  document.getElementById('res-incorrect-val').textContent = attempt.incorrect_count;

  const container = document.getElementById('test-breakdown-list');
  container.innerHTML = questions.map((q, idx) => `
    <div style="background: var(--bg-card); border: 1px solid var(--border); border-left: 4px solid ${q.is_correct ? 'var(--status-success)' : 'var(--status-danger)'}; border-radius: var(--radius-md); padding: 14px;">
      <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
        <span style="font-weight: 700; font-size: 13px;">Q${idx + 1}. ${escapeHtml(q.question_text)}</span>
        <span class="badge ${q.is_correct ? 'badge-green' : 'badge-red'}">${q.is_correct ? 'CORRECT (+2)' : 'INCORRECT (-0.5)'}</span>
      </div>
      <div style="font-size: 12px; margin-bottom: 4px;">
        <strong>Your Answer:</strong> ${escapeHtml(q.user_answer || 'Unattempted')}
      </div>
      <div style="font-size: 12px; margin-bottom: 8px; color: var(--status-success);">
        <strong>Correct Answer:</strong> ${escapeHtml(q.correct_answer || '')}
      </div>
      <div style="font-size: 12px; background: var(--bg-subtle); padding: 10px; border-radius: var(--radius-sm); color: var(--text-muted); line-height: 1.4;">
        <strong>Solution & Explanation:</strong> ${escapeHtml(q.explanation || 'No explanation provided.')}
        <div style="margin-top: 4px; font-size: 11px; font-family: var(--font-mono); color: var(--text-faint);">Source: ${escapeHtml(q.source_reference || '')}</div>
      </div>
    </div>
  `).join('');

  openModal('modal-test-results');
}

// ==========================================================================
// VIEW: MISTAKE NOTEBOOK
// ==========================================================================
async function loadMistakesList() {
  const status = document.getElementById('mistake-status-filter').value;
  const error_type = document.getElementById('mistake-type-filter').value;

  let url = '/api/mistakes?';
  if (status) url += `status=${status}&`;
  if (error_type) url += `error_type=${encodeURIComponent(error_type)}&`;

  try {
    const res = await fetch(url);
    const mistakes = await res.json();
    renderMistakesCards(mistakes);
  } catch (e) {
    console.error('Failed to load mistakes:', e);
  }
}

function renderMistakesCards(mistakes) {
  const container = document.getElementById('mistakes-list-container');
  if (!mistakes || mistakes.length === 0) {
    container.innerHTML = '<div style="text-align: center; color: var(--text-muted); padding: 40px 0;">No mistake records matching the selected filter. Keep eliminating errors!</div>';
    return;
  }

  container.innerHTML = mistakes.map(m => `
    <div class="card" style="margin-bottom: 0; border-left: 4px solid ${m.status === 'mastered' ? 'var(--status-success)' : 'var(--status-danger)'};">
      <div class="card-header" style="margin-bottom: 8px; padding-bottom: 8px;">
        <div>
          <span class="badge ${m.error_type === 'Memory Failure' ? 'badge-amber' : m.error_type === 'Conceptual Misunderstanding' ? 'badge-red' : 'badge-blue'}">${m.error_type}</span>
          <span style="font-size: 12px; color: var(--text-muted); margin-left: 8px;">${escapeHtml(m.subject_name)} • ${escapeHtml(m.chapter_name)}</span>
        </div>
        <div style="display: flex; align-items: center; gap: 8px;">
          <span class="badge ${m.repeated_count > 1 ? 'badge-red' : 'badge-gray'}">Failed ${m.repeated_count}x</span>
          <span class="badge ${m.status === 'mastered' ? 'badge-green' : 'badge-amber'}">${m.status.toUpperCase()}</span>
        </div>
      </div>
      <div style="font-weight: 600; font-size: 14px; margin-bottom: 8px;">${escapeHtml(m.question_text)}</div>
      <div style="font-size: 12px; margin-bottom: 4px; color: var(--status-danger);">
        <strong>Your Missed Answer:</strong> ${escapeHtml(m.user_selected_answer)}
      </div>
      <div style="font-size: 12px; margin-bottom: 10px; color: var(--status-success);">
        <strong>Correct Answer:</strong> ${escapeHtml(m.correct_answer)}
      </div>
      <div style="font-size: 12px; background: var(--bg-subtle); padding: 10px; border-radius: var(--radius-sm); margin-bottom: 10px;">
        ${escapeHtml(m.explanation)}
      </div>
      ${m.user_reflection ? `
        <div style="font-size: 12px; background: var(--accent-primary-light); padding: 8px 12px; border-radius: var(--radius-sm); margin-bottom: 10px; color: var(--accent-primary-text);">
          <strong>Personal Reflection:</strong> ${escapeHtml(m.user_reflection)}
        </div>
      ` : ''}
      <div style="display: flex; gap: 8px; justify-content: flex-end;">
        <button class="btn btn-secondary btn-sm" onclick="openMistakeEditModal(${m.id}, '${escapeJsString(m.error_type)}', '${escapeJsString(m.user_reflection || '')}', '${m.status}')">Classify & Reflect</button>
        <button class="btn btn-secondary btn-sm" onclick="toggleMistakeMastered(${m.id}, '${m.status}')">${m.status === 'mastered' ? 'Mark Unresolved' : 'Mark Mastered'}</button>
      </div>
    </div>
  `).join('');
}

function openMistakeEditModal(id, errorType, reflection, status) {
  document.getElementById('mistake-edit-id').value = id;
  document.getElementById('mistake-edit-type').value = errorType || 'Unclassified';
  document.getElementById('mistake-edit-reflection').value = reflection || '';
  document.getElementById('mistake-edit-status').value = status || 'unresolved';
  openModal('modal-mistake-edit');
}

async function handleMistakeEditSubmit(event) {
  event.preventDefault();
  const id = document.getElementById('mistake-edit-id').value;
  const error_type = document.getElementById('mistake-edit-type').value;
  const user_reflection = document.getElementById('mistake-edit-reflection').value.trim();
  const status = document.getElementById('mistake-edit-status').value;

  try {
    const res = await fetch(`/api/mistakes/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error_type, user_reflection, status })
    });
    if (res.ok) {
      showToast('Mistake record updated.', 'success');
      closeModal('modal-mistake-edit');
      loadMistakesList();
      refreshGlobalBadges();
    }
  } catch (e) {
    showToast('Failed to update mistake.', 'danger');
  }
}

async function toggleMistakeMastered(id, currentStatus) {
  const newStatus = currentStatus === 'mastered' ? 'unresolved' : 'mastered';
  try {
    await fetch(`/api/mistakes/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus })
    });
    showToast(`Mistake marked as ${newStatus}.`, 'success');
    loadMistakesList();
    refreshGlobalBadges();
  } catch (e) {}
}

// ==========================================================================
// VIEW: REVISION SCHEDULE (SPACED REPETITION)
// ==========================================================================
async function loadRevisionSchedule() {
  try {
    const [summaryRes, cardsRes] = await Promise.all([
      fetch('/api/flashcards/due-summary'),
      fetch('/api/flashcards?limit=100')
    ]);

    const summary = await summaryRes.json();
    const cards = await cardsRes.json();

    document.getElementById('rev-overdue-val').textContent = summary.overdue_count;
    document.getElementById('rev-today-val').textContent = summary.due_today_count;
    document.getElementById('rev-done-val').textContent = summary.reviewed_today;

    const tbody = document.getElementById('revision-queue-table-body');
    if (!cards || cards.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; color: var(--text-muted);">No flashcards scheduled yet.</td></tr>';
      return;
    }

    tbody.innerHTML = cards.map(c => `
      <tr>
        <td style="font-weight: 600; max-width: 280px;">${escapeHtml(c.question)}</td>
        <td>${escapeHtml(c.subject_name)} • ${escapeHtml(c.chapter_name)}</td>
        <td>
          <span class="${isOverdueDate(c.due_date) ? 'badge badge-red' : 'badge badge-gray'}">${c.due_date}</span>
        </td>
        <td>${c.lapses}x</td>
        <td>${c.ease_factor}</td>
        <td>
          <span class="badge ${isOverdueDate(c.due_date) ? 'badge-red' : 'badge-green'}">${isOverdueDate(c.due_date) ? 'OVERDUE' : 'SCHEDULED'}</span>
        </td>
      </tr>
    `).join('');
  } catch (e) {
    console.error('Failed to load revision schedule:', e);
  }
}

// ==========================================================================
// VIEW: AUTHENTIC PYQS
// ==========================================================================
async function loadPYQsList() {
  try {
    const res = await fetch('/api/pyqs');
    const pyqs = await res.json();
    renderPYQsTable(pyqs);
  } catch (e) {
    console.error('Failed to load PYQs:', e);
  }
}

function renderPYQsTable(pyqs) {
  const tbody = document.getElementById('pyqs-table-body');
  if (!pyqs || pyqs.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; color: var(--text-muted);">No authentic PYQs recorded yet. Click "+ Add Verified PYQ" to catalog verified past exam questions.</td></tr>';
    return;
  }

  tbody.innerHTML = pyqs.map(p => `
    <tr>
      <td>
        <div style="font-weight: 600;">${escapeHtml(p.pyq_exam)}</div>
        <div style="font-size: 11px; color: var(--text-muted);">${p.pyq_year}</div>
      </td>
      <td>
        <div style="font-weight: 500;">${escapeHtml(p.chapter_name)}</div>
        <div style="font-size: 11px; color: var(--text-muted);">${escapeHtml(p.subject_name)}</div>
      </td>
      <td style="font-weight: 600; max-width: 260px;">${escapeHtml(p.question_text)}</td>
      <td style="font-size: 11px; color: var(--text-muted); max-width: 180px;">
        ${(p.options || []).map((opt, i) => `<div>${String.fromCharCode(65+i)}: ${escapeHtml(opt)}</div>`).join('')}
      </td>
      <td style="font-weight: 700; color: var(--status-success);">${escapeHtml(p.correct_answer)}</td>
      <td><span class="badge badge-green">VERIFIED AUTHENTIC</span></td>
      <td>
        <button class="btn btn-danger btn-sm" onclick="confirmDeletePYQ(${p.id})">Delete</button>
      </td>
    </tr>
  `).join('');
}

function openPYQModal() {
  document.getElementById('form-pyq').reset();
  populateSubjectSelect('pyq-subject-select');
  populateChapterSelect('pyq-subject-select', 'pyq-chapter-select');
  openModal('modal-pyq');
}

async function handlePYQSubmit(event) {
  event.preventDefault();
  const subject_id = parseInt(document.getElementById('pyq-subject-select').value);
  const chapter_id = parseInt(document.getElementById('pyq-chapter-select').value);
  const pyq_exam = document.getElementById('pyq-exam').value.trim();
  const pyq_year = document.getElementById('pyq-year').value.trim();
  const question_text = document.getElementById('pyq-q-text').value.trim();
  const optA = document.getElementById('pyq-opt-a').value.trim();
  const optB = document.getElementById('pyq-opt-b').value.trim();
  const optC = document.getElementById('pyq-opt-c').value.trim();
  const optD = document.getElementById('pyq-opt-d').value.trim();
  const correctChoice = document.getElementById('pyq-correct-select').value;
  const explanation = document.getElementById('pyq-explanation').value.trim();

  const options = [optA, optB, optC, optD];
  const choiceIndex = { A: 0, B: 1, C: 2, D: 3 }[correctChoice];
  const correct_answer = options[choiceIndex];

  try {
    const res = await fetch('/api/pyqs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subject_id, chapter_id, question_text, options, correct_answer,
        explanation, pyq_exam, pyq_year, verification_status: 'verified_authentic'
      })
    });

    if (res.ok) {
      showToast('Verified PYQ added.', 'success');
      closeModal('modal-pyq');
      loadPYQsList();
    }
  } catch (e) {
    showToast('Failed to save PYQ.', 'danger');
  }
}

function confirmDeletePYQ(id) {
  showConfirmModal('Delete PYQ', 'Delete this verified question record?', async () => {
    try {
      await fetch(`/api/pyqs/${id}`, { method: 'DELETE' });
      showToast('PYQ deleted.', 'success');
      loadPYQsList();
    } catch (e) {
      showToast('Failed to delete.', 'danger');
    }
  });
}

// ==========================================================================
// VIEW: PERFORMANCE ANALYTICS
// ==========================================================================
async function loadAnalyticsView() {
  try {
    const res = await fetch('/api/analytics/dashboard');
    const data = await res.json();

    // Consistency log
    const consTbody = document.getElementById('analytics-consistency-table');
    consTbody.innerHTML = (data.activity_trend || []).map(day => `
      <tr>
        <td style="font-weight: 600;">${day.label} (${day.date})</td>
        <td>${day.cards}</td>
        <td>${day.tests}</td>
        <td style="font-weight: 700;">${day.total_items} interactions</td>
      </tr>
    `).join('');

    // Chapter diagnostics table
    const chTbody = document.getElementById('analytics-chapters-table');
    chTbody.innerHTML = (data.chapter_performance || []).map(c => `
      <tr>
        <td style="font-size: 11px; color: var(--text-muted);">${escapeHtml(c.subject_name)}</td>
        <td style="font-weight: 600;">${escapeHtml(c.chapter_name)}</td>
        <td><span class="badge ${c.status === 'Completed' || c.status === 'Mastered' ? 'badge-green' : 'badge-gray'}">${c.status}</span></td>
        <td>${c.note_count}</td>
        <td>${c.card_count}</td>
        <td>${c.due_card_count}</td>
        <td>${c.test_count}</td>
        <td>
          <span class="${c.accuracy !== null && c.accuracy < 60 ? 'badge badge-red' : 'badge badge-green'}">
            ${c.accuracy !== null ? `${c.accuracy}%` : 'N/A'}
          </span>
        </td>
        <td>${c.active_mistakes}</td>
      </tr>
    `).join('');
  } catch (e) {
    console.error('Failed to load analytics:', e);
  }
}

// ==========================================================================
// VIEW: SETTINGS & BACKUP
// ==========================================================================
async function loadSettingsView() {
  try {
    const res = await fetch('/api/settings');
    const settings = await res.json();

    document.getElementById('setting-daily-rev-limit').value = settings.daily_revision_limit || 50;
    document.getElementById('setting-daily-new-limit').value = settings.daily_new_cards || 20;
    document.getElementById('setting-target-minutes').value = settings.daily_target_minutes || 180;
    document.getElementById('setting-passcode').value = settings.passcode || '2486';
  } catch (e) {
    console.error('Failed to load settings:', e);
  }
}

async function handleSettingsUpdate(event) {
  event.preventDefault();
  const daily_revision_limit = parseInt(document.getElementById('setting-daily-rev-limit').value);
  const daily_new_cards = parseInt(document.getElementById('setting-daily-new-limit').value);
  const daily_target_minutes = parseInt(document.getElementById('setting-target-minutes').value);

  try {
    await fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ daily_revision_limit, daily_new_cards, daily_target_minutes })
    });
    showToast('Daily study targets updated.', 'success');
  } catch (e) {
    showToast('Failed to save targets.', 'danger');
  }
}

async function handlePasscodeChange(event) {
  event.preventDefault();
  const passcode = document.getElementById('setting-passcode').value.trim();
  if (passcode.length < 4) {
    showToast('Passcode must be at least 4 characters.', 'danger');
    return;
  }

  try {
    await fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ passcode })
    });
    showToast(`Access passcode updated to '${passcode}'.`, 'success');
  } catch (e) {
    showToast('Failed to update passcode.', 'danger');
  }
}

async function exportDataBackup() {
  try {
    const res = await fetch('/api/settings/backup');
    const data = await res.json();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rankion_backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showToast('Complete database backup exported.', 'success');
  } catch (e) {
    showToast('Failed to export backup.', 'danger');
  }
}

async function handleRestoreBackup(event) {
  const file = event.target.files[0];
  if (!file) return;

  showConfirmModal('Restore Database', 'Restoring will overwrite current database records with the backup. Proceed?', async () => {
    const formData = new FormData();
    formData.append('file', file);
    showToast('Restoring database...', 'info');

    try {
      const res = await fetch('/api/settings/restore', {
        method: 'POST',
        body: formData
      });
      if (res.ok) {
        showToast('Database restored successfully.', 'success');
        location.reload();
      } else {
        showToast('Restore failed. Invalid file.', 'danger');
      }
    } catch (e) {
      showToast('Error restoring backup.', 'danger');
    }
  });
}

// ==========================================================================
// UI Helper Utilities
// ==========================================================================
function openModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.add('open');
}

function closeModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove('open');
}

function showConfirmModal(title, message, onConfirm) {
  document.getElementById('confirm-modal-title').textContent = title;
  document.getElementById('confirm-modal-msg').textContent = message;
  const btn = document.getElementById('confirm-modal-btn');
  btn.onclick = () => {
    closeModal('modal-confirm');
    onConfirm();
  };
  openModal('modal-confirm');
}

function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span>${escapeHtml(message)}</span><span style="cursor:pointer; margin-left:12px;" onclick="this.parentElement.remove()">×</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.remove();
  }, 4000);
}

function populateSubjectSelect(selectId, selectedId = null) {
  const select = document.getElementById(selectId);
  if (!select) return;
  select.innerHTML = subjectsCache.map(s => `
    <option value="${s.id}" ${selectedId && String(s.id) === String(selectedId) ? 'selected' : ''}>
      ${escapeHtml(s.name)}
    </option>
  `).join('');
}

function populateSubjectFilter(selectId, includeAll = true) {
  const select = document.getElementById(selectId);
  if (!select) return;
  let html = includeAll ? '<option value="">All Subjects</option>' : '';
  html += subjectsCache.map(s => `<option value="${s.id}">${escapeHtml(s.name)}</option>`).join('');
  select.innerHTML = html;
}

async function populateChapterSelect(subjectSelectId, chapterSelectId, selectedChapterId = null) {
  const subSelect = document.getElementById(subjectSelectId);
  const chapSelect = document.getElementById(chapterSelectId);
  if (!subSelect || !chapSelect) return;

  const subId = subSelect.value;
  if (!subId) {
    chapSelect.innerHTML = '<option value="">Select subject first</option>';
    return;
  }

  try {
    const res = await fetch(`/api/subjects/${subId}/chapters`);
    const chapters = await res.json();
    let optionsHtml = '';
    if (chapterSelectId === 'test-chapter-select') {
      optionsHtml += '<option value="">All Chapters in Subject</option>';
    }
    optionsHtml += chapters.map(c => `
      <option value="${c.id}" ${selectedChapterId && String(c.id) === String(selectedChapterId) ? 'selected' : ''}>
        ${escapeHtml(c.name)}
      </option>
    `).join('');
    chapSelect.innerHTML = optionsHtml;
  } catch (e) {
    chapSelect.innerHTML = '<option value="">Error loading chapters</option>';
  }
}

function populateChapterFilter(selectId) {
  const select = document.getElementById(selectId);
  if (!select) return;
  const currentVal = select.value;
  let html = '<option value="">All Chapters</option>';
  html += chaptersCache.map(c => `<option value="${c.id}" ${String(c.id) === String(currentVal) ? 'selected' : ''}>${escapeHtml(c.subject_name)} • ${escapeHtml(c.name)}</option>`).join('');
  select.innerHTML = html;
}

async function populateNoteSelect(chapterSelectId, noteSelectId, selectedNoteId = null) {
  const chapSelect = document.getElementById(chapterSelectId);
  const noteSelect = document.getElementById(noteSelectId);
  if (!chapSelect || !noteSelect) return;

  const chapId = chapSelect.value;
  if (!chapId) {
    noteSelect.innerHTML = '<option value="">All Notes in Chapter</option>';
    return;
  }

  try {
    const res = await fetch(`/api/notes?chapter_id=${chapId}`);
    const notes = await res.json();
    let html = '<option value="">All Notes in Chapter</option>';
    html += notes.map(n => `
      <option value="${n.id}" ${selectedNoteId && String(n.id) === String(selectedNoteId) ? 'selected' : ''}>
        ${escapeHtml(n.title)} (${n.source_type.toUpperCase()})
      </option>
    `).join('');
    noteSelect.innerHTML = html;
  } catch (e) {}
}

function escapeHtml(text) {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function escapeJsString(text) {
  if (!text) return '';
  return String(text).replace(/'/g, "\\'").replace(/"/g, '\\"');
}
